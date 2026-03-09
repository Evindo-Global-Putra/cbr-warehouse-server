import { InvoiceRepository } from "../repositories/invoice.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { invoices } from "../db/schema";

type Invoice = typeof invoices.$inferSelect;
type NewInvoice = typeof invoices.$inferInsert;
type UpdateInvoice = Partial<Omit<NewInvoice, "id" | "createdAt">>;

export class InvoiceService {
  constructor(
    private repo: InvoiceRepository,
    private exportOrderRepo: ExportOrderRepository
  ) {}

  async getAll(): Promise<Invoice[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Invoice> {
    const invoice = await this.repo.findById(id);
    if (!invoice) throw new Error(`Invoice with id ${id} not found`);
    return invoice;
  }

  async getByInvoiceNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.repo.findByInvoiceNumber(invoiceNumber);
    if (!invoice) throw new Error(`Invoice '${invoiceNumber}' not found`);
    return invoice;
  }

  async getByExportOrder(exportOrderId: number): Promise<Invoice[]> {
    return this.repo.findByExportOrder(exportOrderId);
  }

  async getByClient(clientId: number): Promise<Invoice[]> {
    return this.repo.findByClient(clientId);
  }

  async getByStatus(status: Invoice["status"]): Promise<Invoice[]> {
    return this.repo.findByStatus(status);
  }

  async create(data: NewInvoice): Promise<Invoice> {
    const order = await this.exportOrderRepo.findById(data.exportOrderId);
    if (!order) {
      throw new Error(`Export order with id ${data.exportOrderId} not found`);
    }
    return this.repo.create(data);
  }

  async send(id: number): Promise<Invoice> {
    const invoice = await this.getById(id);
    if (invoice.status !== "draft") {
      throw new Error(
        `Invoice id ${id} cannot be sent (current status: '${invoice.status}')`
      );
    }
    const updated = await this.repo.update(id, {
      status: "sent",
      issuedAt: new Date(),
    });
    if (!updated) throw new Error(`Failed to update invoice with id ${id}`);
    return updated;
  }

  async markPaid(id: number): Promise<Invoice> {
    const invoice = await this.getById(id);
    if (invoice.status !== "sent" && invoice.status !== "overdue") {
      throw new Error(
        `Invoice id ${id} cannot be marked paid (current status: '${invoice.status}')`
      );
    }
    const updated = await this.repo.update(id, { status: "paid" });
    if (!updated) throw new Error(`Failed to update invoice with id ${id}`);
    return updated;
  }

  async markOverdue(id: number): Promise<Invoice> {
    const invoice = await this.getById(id);
    if (invoice.status !== "sent") {
      throw new Error(
        `Invoice id ${id} cannot be marked overdue (current status: '${invoice.status}')`
      );
    }
    const updated = await this.repo.update(id, { status: "overdue" });
    if (!updated) throw new Error(`Failed to update invoice with id ${id}`);
    return updated;
  }

  async cancel(id: number): Promise<Invoice> {
    const invoice = await this.getById(id);
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      throw new Error(
        `Invoice id ${id} cannot be cancelled (current status: '${invoice.status}')`
      );
    }
    const updated = await this.repo.update(id, { status: "cancelled" });
    if (!updated) throw new Error(`Failed to update invoice with id ${id}`);
    return updated;
  }

  async update(id: number, data: UpdateInvoice): Promise<Invoice> {
    const invoice = await this.getById(id);
    if (invoice.status !== "draft") {
      throw new Error(`Only draft invoices can be updated`);
    }
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update invoice with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<Invoice> {
    const invoice = await this.getById(id);
    if (invoice.status !== "draft") {
      throw new Error(
        `Only draft invoices can be deleted (current status: '${invoice.status}')`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete invoice with id ${id}`);
    return deleted;
  }
}
