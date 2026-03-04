import { SupplierRepository } from "../repositories/supplier.repository";
import { suppliers } from "../db/schema";

type Supplier = typeof suppliers.$inferSelect;
type NewSupplier = typeof suppliers.$inferInsert;
type UpdateSupplier = Partial<Omit<NewSupplier, "id" | "createdAt" | "updatedAt">>;

export class SupplierService {
  constructor(private supplierRepo: SupplierRepository) {}

  async getAll(): Promise<Supplier[]> {
    return this.supplierRepo.findAll();
  }

  async getById(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepo.findById(id);
    if (!supplier) throw new Error(`Supplier with id ${id} not found`);
    return supplier;
  }

  async search(name: string): Promise<Supplier[]> {
    return this.supplierRepo.findByName(name);
  }

  async getByCountry(country: string): Promise<Supplier[]> {
    return this.supplierRepo.findByCountry(country);
  }

  async create(data: NewSupplier): Promise<Supplier> {
    return this.supplierRepo.create(data);
  }

  async update(id: number, data: UpdateSupplier): Promise<Supplier> {
    await this.getById(id);
    const updated = await this.supplierRepo.update(id, data);
    if (!updated) throw new Error(`Failed to update supplier with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<Supplier> {
    await this.getById(id);
    const deleted = await this.supplierRepo.delete(id);
    if (!deleted) throw new Error(`Failed to delete supplier with id ${id}`);
    return deleted;
  }
}
