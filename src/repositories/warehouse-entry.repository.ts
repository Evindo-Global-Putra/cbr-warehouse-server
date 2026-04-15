import { and, count, eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
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

  async findPaginated(
    filters: {
      status?: WarehouseEntry["status"];
      branchId?: string;
      travelPermitId?: string;
    },
    page: number,
    limit: number
  ): Promise<{ data: WarehouseEntry[]; total: number }> {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(warehouseEntries.status, filters.status));
    if (filters.branchId) conditions.push(eq(warehouseEntries.branchId, filters.branchId));
    if (filters.travelPermitId) conditions.push(eq(warehouseEntries.travelPermitId, filters.travelPermitId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [data, [{ value: total }]] = await Promise.all([
      this.db.select().from(warehouseEntries).where(where).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(warehouseEntries).where(where),
    ]);
    return { data, total: Number(total) };
  }

  async findById(id: string): Promise<WarehouseEntry | undefined> {
    const result = await this.db
      .select()
      .from(warehouseEntries)
      .where(eq(warehouseEntries.id, id));
    return result[0];
  }

  async findByTravelPermit(travelPermitId: string): Promise<WarehouseEntry[]> {
    return this.db
      .select()
      .from(warehouseEntries)
      .where(eq(warehouseEntries.travelPermitId, travelPermitId));
  }

  async findByBranch(branchId: string): Promise<WarehouseEntry[]> {
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
    id: string,
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
  async incrementScanned(id: string): Promise<WarehouseEntry | undefined> {
    const result = await this.db
      .update(warehouseEntries)
      .set({
        totalUnitsScanned: sql`${warehouseEntries.totalUnitsScanned} + 1`,
      })
      .where(eq(warehouseEntries.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<WarehouseEntry | undefined> {
    const result = await this.db
      .delete(warehouseEntries)
      .where(eq(warehouseEntries.id, id))
      .returning();
    return result[0];
  }
}
