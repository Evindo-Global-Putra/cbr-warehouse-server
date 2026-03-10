import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { invoiceItems } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type InvoiceItem = typeof invoiceItems.$inferSelect;
type NewInvoiceItem = typeof invoiceItems.$inferInsert;
type UpdateInvoiceItem = Partial<Omit<NewInvoiceItem, "id">>;

export class InvoiceItemRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<InvoiceItem[]> {
    return this.db.select().from(invoiceItems);
  }

  async findById(id: number): Promise<InvoiceItem | undefined> {
    const result = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.id, id));
    return result[0];
  }

  async findByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(invoiceItems.sortOrder);
  }

  async create(data: NewInvoiceItem): Promise<InvoiceItem> {
    const result = await this.db.insert(invoiceItems).values(data).returning();
    return result[0];
  }

  async update(
    id: number,
    data: UpdateInvoiceItem
  ): Promise<InvoiceItem | undefined> {
    const result = await this.db
      .update(invoiceItems)
      .set(data)
      .where(eq(invoiceItems.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<InvoiceItem | undefined> {
    const result = await this.db
      .delete(invoiceItems)
      .where(eq(invoiceItems.id, id))
      .returning();
    return result[0];
  }
}
