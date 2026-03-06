import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { exportOrders } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type ExportOrder = typeof exportOrders.$inferSelect;
type NewExportOrder = typeof exportOrders.$inferInsert;
type UpdateExportOrder = Partial<Omit<NewExportOrder, "id" | "createdAt">>;

export class ExportOrderRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<ExportOrder[]> {
    return this.db.select().from(exportOrders);
  }

  async findById(id: number): Promise<ExportOrder | undefined> {
    const result = await this.db
      .select()
      .from(exportOrders)
      .where(eq(exportOrders.id, id));
    return result[0];
  }

  async findByOrderNumber(orderNumber: string): Promise<ExportOrder | undefined> {
    const result = await this.db
      .select()
      .from(exportOrders)
      .where(eq(exportOrders.orderNumber, orderNumber));
    return result[0];
  }

  async findByClient(clientId: number): Promise<ExportOrder[]> {
    return this.db
      .select()
      .from(exportOrders)
      .where(eq(exportOrders.clientId, clientId));
  }

  async findByBranch(branchId: number): Promise<ExportOrder[]> {
    return this.db
      .select()
      .from(exportOrders)
      .where(eq(exportOrders.branchId, branchId));
  }

  async findByStatus(status: ExportOrder["status"]): Promise<ExportOrder[]> {
    return this.db
      .select()
      .from(exportOrders)
      .where(eq(exportOrders.status, status));
  }

  async create(data: NewExportOrder): Promise<ExportOrder> {
    const result = await this.db.insert(exportOrders).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateExportOrder): Promise<ExportOrder | undefined> {
    const result = await this.db
      .update(exportOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(exportOrders.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<ExportOrder | undefined> {
    const result = await this.db
      .delete(exportOrders)
      .where(eq(exportOrders.id, id))
      .returning();
    return result[0];
  }
}
