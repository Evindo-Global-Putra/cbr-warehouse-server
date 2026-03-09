import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { payments } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Payment = typeof payments.$inferSelect;
type NewPayment = typeof payments.$inferInsert;

export class PaymentRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Payment[]> {
    return this.db.select().from(payments);
  }

  async findById(id: number): Promise<Payment | undefined> {
    const result = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return result[0];
  }

  async findByInvoice(invoiceId: number): Promise<Payment[]> {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));
  }

  async findByMethod(paymentMethod: Payment["paymentMethod"]): Promise<Payment[]> {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.paymentMethod, paymentMethod));
  }

  async create(data: NewPayment): Promise<Payment> {
    const result = await this.db.insert(payments).values(data).returning();
    return result[0];
  }

  async delete(id: number): Promise<Payment | undefined> {
    const result = await this.db
      .delete(payments)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }
}
