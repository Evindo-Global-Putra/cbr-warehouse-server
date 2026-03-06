import { eq } from "drizzle-orm";
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

  async findById(id: number): Promise<Motorcycle | undefined> {
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

  async findByBranch(branchId: number): Promise<Motorcycle[]> {
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

  async findByEntry(entryId: number): Promise<Motorcycle[]> {
    return this.db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.entryId, entryId));
  }

  async findByType(typeId: number): Promise<Motorcycle[]> {
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
    id: number,
    data: UpdateMotorcycle
  ): Promise<Motorcycle | undefined> {
    const result = await this.db
      .update(motorcycles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(motorcycles.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<Motorcycle | undefined> {
    const result = await this.db
      .delete(motorcycles)
      .where(eq(motorcycles.id, id))
      .returning();
    return result[0];
  }
}
