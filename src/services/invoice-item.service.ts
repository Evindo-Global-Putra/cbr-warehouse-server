import { InvoiceItemRepository } from "../repositories/invoice-item.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { invoiceItems } from "../db/schema";

type InvoiceItem = typeof invoiceItems.$inferSelect;
type NewInvoiceItem = typeof invoiceItems.$inferInsert;
type UpdateInvoiceItem = Partial<Omit<NewInvoiceItem, "id">>;

// amount is auto-computed from quantity × unitPrice
type CreateInvoiceItem = Omit<NewInvoiceItem, "amount">;

export class InvoiceItemService {
  constructor(
    private repo: InvoiceItemRepository,
    private invoiceRepo: InvoiceRepository
  ) {}

  async getAll(): Promise<InvoiceItem[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<InvoiceItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new Error(`Invoice item with id ${id} not found`);
    return item;
  }

  async getByInvoice(invoiceId: number): Promise<InvoiceItem[]> {
    return this.repo.findByInvoice(invoiceId);
  }

  async create(data: CreateInvoiceItem): Promise<InvoiceItem> {
    const invoice = await this.invoiceRepo.findById(data.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with id ${data.invoiceId} not found`);
    }
    if (invoice.status !== "draft") {
      throw new Error(
        `Cannot add items to an invoice with status '${invoice.status}'`
      );
    }
    // Auto-compute amount = quantity × unitPrice
    const amount = (data.quantity * parseFloat(data.unitPrice)).toFixed(2);
    return this.repo.create({ ...data, amount });
  }

  async update(id: number, data: UpdateInvoiceItem): Promise<InvoiceItem> {
    const item = await this.getById(id);
    const invoice = await this.invoiceRepo.findById(item.invoiceId);
    if (!invoice || invoice.status !== "draft") {
      throw new Error(
        `Cannot modify items of an invoice with status '${invoice?.status}'`
      );
    }
    // Recompute amount whenever quantity or unitPrice changes
    const patch: UpdateInvoiceItem = { ...data };
    if (data.quantity != null || data.unitPrice != null) {
      const qty = data.quantity ?? item.quantity;
      const price = parseFloat(data.unitPrice ?? item.unitPrice);
      patch.amount = (qty * price).toFixed(2);
    }
    const updated = await this.repo.update(id, patch);
    if (!updated) throw new Error(`Failed to update invoice item with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<InvoiceItem> {
    const item = await this.getById(id);
    const invoice = await this.invoiceRepo.findById(item.invoiceId);
    if (!invoice || invoice.status !== "draft") {
      throw new Error(
        `Cannot delete items of an invoice with status '${invoice?.status}'`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete invoice item with id ${id}`);
    return deleted;
  }
}
