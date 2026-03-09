import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { invoices } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Invoice = typeof invoices.$inferSelect;
type NewInvoice = typeof invoices.$inferInsert;
type UpdateInvoice = Partial<Omit<NewInvoice, "id" | "createdAt">>;

export class InvoiceRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Invoice[]> {
    return this.db.select().from(invoices);
  }

  async findById(id: number): Promise<Invoice | undefined> {
    const result = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return result[0];
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const result = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));
    return result[0];
  }

  async findByExportOrder(exportOrderId: number): Promise<Invoice[]> {
    return this.db
      .select()
      .from(invoices)
      .where(eq(invoices.exportOrderId, exportOrderId));
  }

  async findByClient(clientId: number): Promise<Invoice[]> {
    return this.db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId));
  }

  async findByStatus(status: Invoice["status"]): Promise<Invoice[]> {
    return this.db
      .select()
      .from(invoices)
      .where(eq(invoices.status, status));
  }

  async create(data: NewInvoice): Promise<Invoice> {
    const result = await this.db.insert(invoices).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateInvoice): Promise<Invoice | undefined> {
    const result = await this.db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<Invoice | undefined> {
    const result = await this.db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }
}
