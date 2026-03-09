import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { warehouseTransfers } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type WarehouseTransfer = typeof warehouseTransfers.$inferSelect;
type NewWarehouseTransfer = typeof warehouseTransfers.$inferInsert;
type UpdateWarehouseTransfer = Partial<Omit<NewWarehouseTransfer, "id" | "createdAt">>;

export class WarehouseTransferRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<WarehouseTransfer[]> {
    return this.db.select().from(warehouseTransfers);
  }

  async findById(id: number): Promise<WarehouseTransfer | undefined> {
    const result = await this.db
      .select()
      .from(warehouseTransfers)
      .where(eq(warehouseTransfers.id, id));
    return result[0];
  }

  async findByFromBranch(fromBranchId: number): Promise<WarehouseTransfer[]> {
    return this.db
      .select()
      .from(warehouseTransfers)
      .where(eq(warehouseTransfers.fromBranchId, fromBranchId));
  }

  async findByToBranch(toBranchId: number): Promise<WarehouseTransfer[]> {
    return this.db
      .select()
      .from(warehouseTransfers)
      .where(eq(warehouseTransfers.toBranchId, toBranchId));
  }

  async findByStatus(status: WarehouseTransfer["status"]): Promise<WarehouseTransfer[]> {
    return this.db
      .select()
      .from(warehouseTransfers)
      .where(eq(warehouseTransfers.status, status));
  }

  async create(data: NewWarehouseTransfer): Promise<WarehouseTransfer> {
    const result = await this.db.insert(warehouseTransfers).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateWarehouseTransfer): Promise<WarehouseTransfer | undefined> {
    const result = await this.db
      .update(warehouseTransfers)
      .set(data)
      .where(eq(warehouseTransfers.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<WarehouseTransfer | undefined> {
    const result = await this.db
      .delete(warehouseTransfers)
      .where(eq(warehouseTransfers.id, id))
      .returning();
    return result[0];
  }
}
