import { and, count, eq, ilike, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { motorcycles } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Motorcycle = typeof motorcycles.$inferSelect;
type NewMotorcycle = typeof motorcycles.$inferInsert;
type UpdateMotorcycle = Partial<
  Omit<NewMotorcycle, "id" | "createdAt" | "updatedAt">
>;

export class MotorcycleRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Motorcycle[]> {
    return this.db.select().from(motorcycles);
  }

  async findPaginated(
    filters: {
      status?: Motorcycle["status"];
      branchId?: string;
      typeId?: string;
      color?: string;
      search?: string;
    },
    page: number,
    limit: number
  ): Promise<{ data: Motorcycle[]; total: number }> {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(motorcycles.status, filters.status));
    if (filters.branchId) conditions.push(eq(motorcycles.branchId, filters.branchId));
    if (filters.typeId) conditions.push(eq(motorcycles.typeId, filters.typeId));
    if (filters.color) conditions.push(ilike(motorcycles.color, `%${filters.color}%`));
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(motorcycles.frameNumber, pattern),
          ilike(motorcycles.engineNumber, pattern),
          ilike(motorcycles.noInduk, pattern)
        )!
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [data, [{ value: total }]] = await Promise.all([
      this.db.select().from(motorcycles).where(where).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(motorcycles).where(where),
    ]);
    return { data, total: Number(total) };
  }

  async findById(id: string): Promise<Motorcycle | undefined> {
    const result = await this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.id, id));
    return result[0];
  }

  async findByFrameNumber(frameNumber: string): Promise<Motorcycle | undefined> {
    const result = await this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.frameNumber, frameNumber));
    return result[0];
  }

  async findByEngineNumber(engineNumber: string): Promise<Motorcycle | undefined> {
    const result = await this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.engineNumber, engineNumber));
    return result[0];
  }

  async findByNoInduk(noInduk: string): Promise<Motorcycle | undefined> {
    const result = await this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.noInduk, noInduk));
    return result[0];
  }

  async findByBarcode(barcode: string): Promise<Motorcycle | undefined> {
    const result = await this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.barcode, barcode));
    return result[0];
  }

  async findByBranch(branchId: string): Promise<Motorcycle[]> {
    return this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.branchId, branchId));
  }

  async findByStatus(status: Motorcycle["status"]): Promise<Motorcycle[]> {
    return this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.status, status));
  }

  async findByEntry(entryId: string): Promise<Motorcycle[]> {
    return this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.entryId, entryId));
  }

  async findByType(typeId: string): Promise<Motorcycle[]> {
    return this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.typeId, typeId));
  }

  async create(data: NewMotorcycle): Promise<Motorcycle> {
    const result = await this.db
      .insert(motorcycles)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: UpdateMotorcycle
  ): Promise<Motorcycle | undefined> {
    const result = await this.db
      .update(motorcycles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(motorcycles.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<Motorcycle | undefined> {
    const result = await this.db
      .delete(motorcycles)
      .where(eq(motorcycles.id, id))
      .returning();
    return result[0];
  }
}
