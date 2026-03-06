import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { travelPermits } from "../db/schema";

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

  async findById(id: number): Promise<TravelPermit | undefined> {
    const result = await this.db
      .select()
      .from(travelPermits)
      .where(eq(travelPermits.id, id));
    return result[0];
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

  async findBySupplier(supplierId: number): Promise<TravelPermit[]> {
    return this.db
      .select()
      .from(travelPermits)
      .where(eq(travelPermits.supplierId, supplierId));
  }

  async findByBranch(branchId: number): Promise<TravelPermit[]> {
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
    id: number,
    data: UpdateTravelPermit
  ): Promise<TravelPermit | undefined> {
    const result = await this.db
      .update(travelPermits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(travelPermits.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<TravelPermit | undefined> {
    const result = await this.db
      .delete(travelPermits)
      .where(eq(travelPermits.id, id))
      .returning();
    return result[0];
  }
}
