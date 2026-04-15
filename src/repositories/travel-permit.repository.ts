import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { travelPermits } from "../db/schema";

type TravelPermitWithRelations = typeof travelPermits.$inferSelect & {
  supplier: typeof schema.suppliers.$inferSelect | null;
  branch: typeof schema.branches.$inferSelect | null;
};

type TravelPermitWithDetail = typeof travelPermits.$inferSelect & {
  supplier: typeof schema.suppliers.$inferSelect | null;
  branch: typeof schema.branches.$inferSelect | null;
  items: (typeof schema.travelPermitItems.$inferSelect & {
    motorcycleType: typeof schema.motorcycleTypes.$inferSelect | null;
    reports: (typeof schema.travelPermitItemReports.$inferSelect)[];
  })[];
};

type DB = PostgresJsDatabase<typeof schema>;
type TravelPermit = typeof travelPermits.$inferSelect;
type NewTravelPermit = typeof travelPermits.$inferInsert;
type UpdateTravelPermit = Partial<
  Omit<NewTravelPermit, "id" | "createdAt" | "updatedAt">
>;

export class TravelPermitRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<TravelPermit[]> {
    return this.db.select().from(travelPermits);
  }

  async findAllWithRelations(): Promise<TravelPermitWithRelations[]> {
    return this.db.query.travelPermits.findMany({
      with: { supplier: true, branch: true },
    }) as Promise<TravelPermitWithRelations[]>;
  }

  async findById(id: string): Promise<TravelPermit | undefined> {
    const result = await this.db
      .select()
      .from(travelPermits)
      .where(eq(travelPermits.id, id));
    return result[0];
  }

  async findByIdWithRelations(id: string): Promise<TravelPermitWithDetail | undefined> {
    return this.db.query.travelPermits.findFirst({
      where: eq(travelPermits.id, id),
      with: {
        supplier: true,
        branch: true,
        items: {
          with: {
            motorcycleType: true,
            reports: true,
          },
        },
      },
    }) as Promise<TravelPermitWithDetail | undefined>;
  }

  async findByPermitNumber(
    permitNumber: string
  ): Promise<TravelPermit | undefined> {
    const result = await this.db
      .select()
      .from(travelPermits)
      .where(eq(travelPermits.permitNumber, permitNumber));
    return result[0];
  }

  async findBySupplier(supplierId: string): Promise<TravelPermit[]> {
    return this.db
      .select()
      .from(travelPermits)
      .where(eq(travelPermits.supplierId, supplierId));
  }

  async findByBranch(branchId: string): Promise<TravelPermit[]> {
    return this.db
      .select()
      .from(travelPermits)
      .where(eq(travelPermits.branchId, branchId));
  }

  async findByStatus(
    status: TravelPermit["status"]
  ): Promise<TravelPermit[]> {
    return this.db
      .select()
      .from(travelPermits)
      .where(eq(travelPermits.status, status));
  }

  async create(data: NewTravelPermit): Promise<TravelPermit> {
    const result = await this.db
      .insert(travelPermits)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: UpdateTravelPermit
  ): Promise<TravelPermit | undefined> {
    const result = await this.db
      .update(travelPermits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(travelPermits.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<TravelPermit | undefined> {
    const result = await this.db
      .delete(travelPermits)
      .where(eq(travelPermits.id, id))
      .returning();
    return result[0];
  }
}
