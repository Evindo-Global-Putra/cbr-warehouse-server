import { PaymentRepository } from "../repositories/payment.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { payments } from "../db/schema";

type Payment = typeof payments.$inferSelect;
type NewPayment = typeof payments.$inferInsert;

export class PaymentService {
  constructor(
    private repo: PaymentRepository,
    private invoiceRepo: InvoiceRepository
  ) {}

  async getAll(): Promise<Payment[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Payment> {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error(`Payment with id ${id} not found`);
    return payment;
  }

  async getByInvoice(invoiceId: number): Promise<Payment[]> {
    return this.repo.findByInvoice(invoiceId);
  }

  async getByMethod(paymentMethod: Payment["paymentMethod"]): Promise<Payment[]> {
    return this.repo.findByMethod(paymentMethod);
  }

  async create(data: NewPayment): Promise<Payment> {
    const invoice = await this.invoiceRepo.findById(data.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with id ${data.invoiceId} not found`);
    }
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      throw new Error(
        `Cannot record payment for a ${invoice.status} invoice`
      );
    }

    const payment = await this.repo.create(data);

    // Auto-mark invoice as paid when total payments cover the full amount
    const allPayments = await this.repo.findByInvoice(data.invoiceId);
    const totalPaid = allPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );
    if (totalPaid >= parseFloat(invoice.totalAmount)) {
      await this.invoiceRepo.update(data.invoiceId, { status: "paid" });
    }

    return payment;
  }

  async delete(id: number): Promise<Payment> {
    const payment = await this.getById(id);
    const invoice = await this.invoiceRepo.findById(payment.invoiceId);
    if (invoice?.status === "paid") {
      throw new Error(`Cannot delete a payment from a paid invoice`);
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete payment with id ${id}`);
    return deleted;
  }
}
