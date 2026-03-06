import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { exportOrderItems } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type ExportOrderItem = typeof exportOrderItems.$inferSelect;
type NewExportOrderItem = typeof exportOrderItems.$inferInsert;
type UpdateExportOrderItem = Partial<Omit<NewExportOrderItem, "id">>;

export class ExportOrderItemRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<ExportOrderItem[]> {
    return this.db.select().from(exportOrderItems);
  }

  async findById(id: number): Promise<ExportOrderItem | undefined> {
    const result = await this.db
      .select()
      .from(exportOrderItems)
      .where(eq(exportOrderItems.id, id));
    return result[0];
  }

  async findByExportOrder(exportOrderId: number): Promise<ExportOrderItem[]> {
    return this.db
      .select()
      .from(exportOrderItems)
      .where(eq(exportOrderItems.exportOrderId, exportOrderId));
  }

  async create(data: NewExportOrderItem): Promise<ExportOrderItem> {
    const result = await this.db
      .insert(exportOrderItems)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: number,
    data: UpdateExportOrderItem
  ): Promise<ExportOrderItem | undefined> {
    const result = await this.db
      .update(exportOrderItems)
      .set(data)
      .where(eq(exportOrderItems.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<ExportOrderItem | undefined> {
    const result = await this.db
      .delete(exportOrderItems)
      .where(eq(exportOrderItems.id, id))
      .returning();
    return result[0];
  }
}
