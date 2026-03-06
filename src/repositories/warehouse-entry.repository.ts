import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { warehouseEntries } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type WarehouseEntry = typeof warehouseEntries.$inferSelect;
type NewWarehouseEntry = typeof warehouseEntries.$inferInsert;
type UpdateWarehouseEntry = Partial<
  Omit<NewWarehouseEntry, "id" | "createdAt">
>;

export class WarehouseEntryRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<WarehouseEntry[]> {
    return this.db.select().from(warehouseEntries);
  }

  async findById(id: number): Promise<WarehouseEntry | undefined> {
    const result = await this.db
      .select()
      .from(warehouseEntries)
      .where(eq(warehouseEntries.id, id));
    return result[0];
  }

  async findByTravelPermit(travelPermitId: number): Promise<WarehouseEntry[]> {
    return this.db
      .select()
      .from(warehouseEntries)
      .where(eq(warehouseEntries.travelPermitId, travelPermitId));
  }

  async findByBranch(branchId: number): Promise<WarehouseEntry[]> {
    return this.db
      .select()
      .from(warehouseEntries)
      .where(eq(warehouseEntries.branchId, branchId));
  }

  async findByStatus(
    status: WarehouseEntry["status"]
  ): Promise<WarehouseEntry[]> {
    return this.db
      .select()
      .from(warehouseEntries)
      .where(eq(warehouseEntries.status, status));
  }

  async create(data: NewWarehouseEntry): Promise<WarehouseEntry> {
    const result = await this.db
      .insert(warehouseEntries)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: number,
    data: UpdateWarehouseEntry
  ): Promise<WarehouseEntry | undefined> {
    const result = await this.db
      .update(warehouseEntries)
      .set(data)
      .where(eq(warehouseEntries.id, id))
      .returning();
    return result[0];
  }

  // Atomically increment totalUnitsScanned by 1
  async incrementScanned(id: number): Promise<WarehouseEntry | undefined> {
    const result = await this.db
      .update(warehouseEntries)
      .set({
        totalUnitsScanned: sql`${warehouseEntries.totalUnitsScanned} + 1`,
      })
      .where(eq(warehouseEntries.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<WarehouseEntry | undefined> {
    const result = await this.db
      .delete(warehouseEntries)
      .where(eq(warehouseEntries.id, id))
      .returning();
    return result[0];
  }
}
