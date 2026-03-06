import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { loadingForms } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type LoadingForm = typeof loadingForms.$inferSelect;
type NewLoadingForm = typeof loadingForms.$inferInsert;
type UpdateLoadingForm = Partial<Omit<NewLoadingForm, "id" | "createdAt">>;

export class LoadingFormRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<LoadingForm[]> {
    return this.db.select().from(loadingForms);
  }

  async findById(id: number): Promise<LoadingForm | undefined> {
    const result = await this.db
      .select()
      .from(loadingForms)
      .where(eq(loadingForms.id, id));
    return result[0];
  }

  async findByExportOrder(exportOrderId: number): Promise<LoadingForm[]> {
    return this.db
      .select()
      .from(loadingForms)
      .where(eq(loadingForms.exportOrderId, exportOrderId));
  }

  async findByBranch(branchId: number): Promise<LoadingForm[]> {
    return this.db
      .select()
      .from(loadingForms)
      .where(eq(loadingForms.branchId, branchId));
  }

  async findByStatus(status: LoadingForm["status"]): Promise<LoadingForm[]> {
    return this.db
      .select()
      .from(loadingForms)
      .where(eq(loadingForms.status, status));
  }

  async create(data: NewLoadingForm): Promise<LoadingForm> {
    const result = await this.db.insert(loadingForms).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateLoadingForm): Promise<LoadingForm | undefined> {
    const result = await this.db
      .update(loadingForms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(loadingForms.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<LoadingForm | undefined> {
    const result = await this.db
      .delete(loadingForms)
      .where(eq(loadingForms.id, id))
      .returning();
    return result[0];
  }
}
