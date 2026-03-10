import { PackingListRepository } from "../repositories/packing-list.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { packingLists } from "../db/schema";

type PackingList = typeof packingLists.$inferSelect;
type NewPackingList = typeof packingLists.$inferInsert;
type UpdatePackingList = Partial<Omit<NewPackingList, "id" | "createdAt">>;

export class PackingListService {
  constructor(
    private repo: PackingListRepository,
    private invoiceRepo: InvoiceRepository
  ) {}

  async getAll(): Promise<PackingList[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<PackingList> {
    const pl = await this.repo.findById(id);
    if (!pl) throw new Error(`Packing list with id ${id} not found`);
    return pl;
  }

  async getByInvoice(invoiceId: number): Promise<PackingList> {
    const pl = await this.repo.findByInvoice(invoiceId);
    if (!pl)
      throw new Error(`Packing list for invoice id ${invoiceId} not found`);
    return pl;
  }

  async create(data: NewPackingList): Promise<PackingList> {
    const invoice = await this.invoiceRepo.findById(data.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with id ${data.invoiceId} not found`);
    }
    const existing = await this.repo.findByInvoice(data.invoiceId);
    if (existing) {
      throw new Error(
        `A packing list for invoice id ${data.invoiceId} already exists`
      );
    }
    return this.repo.create(data);
  }

  async update(id: number, data: UpdatePackingList): Promise<PackingList> {
    await this.getById(id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update packing list with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<PackingList> {
    await this.getById(id);
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete packing list with id ${id}`);
    return deleted;
  }
}
