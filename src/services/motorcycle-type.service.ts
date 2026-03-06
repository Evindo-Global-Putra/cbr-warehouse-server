import { MotorcycleTypeRepository } from "../repositories/motorcycle-type.repository";
import { motorcycleTypes } from "../db/schema";

type MotorcycleType = typeof motorcycleTypes.$inferSelect;
type NewMotorcycleType = typeof motorcycleTypes.$inferInsert;
type UpdateMotorcycleType = Partial<Omit<NewMotorcycleType, "id" | "createdAt" | "updatedAt">>;

export class MotorcycleTypeService {
  constructor(private repo: MotorcycleTypeRepository) {}

  async getAll(): Promise<MotorcycleType[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<MotorcycleType> {
    const type = await this.repo.findById(id);
    if (!type) throw new Error(`Motorcycle type with id ${id} not found`);
    return type;
  }

  async getByBrand(brand: string): Promise<MotorcycleType[]> {
    return this.repo.findByBrand(brand);
  }

  async create(data: NewMotorcycleType): Promise<MotorcycleType> {
    const existing = await this.repo.findByBrandAndModel(data.brand, data.model);
    if (existing) {
      throw new Error(`Motorcycle type "${data.brand} ${data.model}" already exists`);
    }
    return this.repo.create(data);
  }

  async update(id: number, data: UpdateMotorcycleType): Promise<MotorcycleType> {
    await this.getById(id);

    if (data.brand || data.model) {
      const current = await this.getById(id);
      const brand = data.brand ?? current.brand;
      const model = data.model ?? current.model;
      const existing = await this.repo.findByBrandAndModel(brand, model);
      if (existing && existing.id !== id) {
        throw new Error(`Motorcycle type "${brand} ${model}" already exists`);
      }
    }

    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update motorcycle type with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<MotorcycleType> {
    await this.getById(id);
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete motorcycle type with id ${id}`);
    return deleted;
  }
}
