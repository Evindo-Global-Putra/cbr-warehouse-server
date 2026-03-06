import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { exportOrderMotorcycles } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type ExportOrderMotorcycle = typeof exportOrderMotorcycles.$inferSelect;
type NewExportOrderMotorcycle = typeof exportOrderMotorcycles.$inferInsert;

export class ExportOrderMotorcycleRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<ExportOrderMotorcycle[]> {
    return this.db.select().from(exportOrderMotorcycles);
  }

  async findById(id: number): Promise<ExportOrderMotorcycle | undefined> {
    const result = await this.db
      .select()
      .from(exportOrderMotorcycles)
      .where(eq(exportOrderMotorcycles.id, id));
    return result[0];
  }

  async findByExportOrder(exportOrderId: number): Promise<ExportOrderMotorcycle[]> {
    return this.db
      .select()
      .from(exportOrderMotorcycles)
      .where(eq(exportOrderMotorcycles.exportOrderId, exportOrderId));
  }

  async findByMotorcycle(motorcycleId: number): Promise<ExportOrderMotorcycle | undefined> {
    const result = await this.db
      .select()
      .from(exportOrderMotorcycles)
      .where(eq(exportOrderMotorcycles.motorcycleId, motorcycleId));
    return result[0];
  }

  async create(data: NewExportOrderMotorcycle): Promise<ExportOrderMotorcycle> {
    const result = await this.db
      .insert(exportOrderMotorcycles)
      .values(data)
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<ExportOrderMotorcycle | undefined> {
    const result = await this.db
      .delete(exportOrderMotorcycles)
      .where(eq(exportOrderMotorcycles.id, id))
      .returning();
    return result[0];
  }
}
