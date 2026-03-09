import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { warehouseTransferMotorcycles } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type WTM = typeof warehouseTransferMotorcycles.$inferSelect;
type NewWTM = typeof warehouseTransferMotorcycles.$inferInsert;

export class WarehouseTransferMotorcycleRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<WTM[]> {
    return this.db.select().from(warehouseTransferMotorcycles);
  }

  async findById(id: number): Promise<WTM | undefined> {
    const result = await this.db
      .select()
      .from(warehouseTransferMotorcycles)
      .where(eq(warehouseTransferMotorcycles.id, id));
    return result[0];
  }

  async findByTransfer(transferId: number): Promise<WTM[]> {
    return this.db
      .select()
      .from(warehouseTransferMotorcycles)
      .where(eq(warehouseTransferMotorcycles.transferId, transferId));
  }

  async findByMotorcycle(motorcycleId: number): Promise<WTM[]> {
    return this.db
      .select()
      .from(warehouseTransferMotorcycles)
      .where(eq(warehouseTransferMotorcycles.motorcycleId, motorcycleId));
  }

  async create(data: NewWTM): Promise<WTM> {
    const result = await this.db
      .insert(warehouseTransferMotorcycles)
      .values(data)
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<WTM | undefined> {
    const result = await this.db
      .delete(warehouseTransferMotorcycles)
      .where(eq(warehouseTransferMotorcycles.id, id))
      .returning();
    return result[0];
  }

  async deleteByTransferAndMotorcycle(
    transferId: number,
    motorcycleId: number
  ): Promise<WTM | undefined> {
    const result = await this.db
      .delete(warehouseTransferMotorcycles)
      .where(
        and(
          eq(warehouseTransferMotorcycles.transferId, transferId),
          eq(warehouseTransferMotorcycles.motorcycleId, motorcycleId)
        )
      )
      .returning();
    return result[0];
  }
}
