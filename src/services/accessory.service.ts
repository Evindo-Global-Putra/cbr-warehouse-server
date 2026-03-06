import { AccessoryRepository } from "../repositories/accessory.repository";
import { accessories } from "../db/schema";

type Accessory = typeof accessories.$inferSelect;
type NewAccessory = typeof accessories.$inferInsert;
type UpdateAccessory = Partial<Omit<NewAccessory, "id" | "createdAt">>;

export class AccessoryService {
  constructor(private repo: AccessoryRepository) {}

  async getAll(): Promise<Accessory[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Accessory> {
    const item = await this.repo.findById(id);
    if (!item) throw new Error(`Accessory with id ${id} not found`);
    return item;
  }

  async getBySku(sku: string): Promise<Accessory> {
    const item = await this.repo.findBySku(sku);
    if (!item) throw new Error(`Accessory with SKU '${sku}' not found`);
    return item;
  }

  async getByBranch(branchId: number): Promise<Accessory[]> {
    return this.repo.findByBranch(branchId);
  }

  async create(data: NewAccessory): Promise<Accessory> {
    const existing = await this.repo.findBySku(data.sku);
    if (existing) {
      throw new Error(`Accessory with SKU '${data.sku}' already exists`);
    }
    return this.repo.create(data);
  }

  async update(id: number, data: UpdateAccessory): Promise<Accessory> {
    await this.getById(id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update accessory with id ${id}`);
    return updated;
  }

  // delta > 0 = add stock, delta < 0 = deduct stock
  async adjustStock(id: number, delta: number): Promise<Accessory> {
    const item = await this.getById(id);
    if (item.quantityInStock + delta < 0) {
      throw new Error(
        `Insufficient stock for accessory id ${id}: available ${item.quantityInStock}, requested deduction ${Math.abs(delta)}`
      );
    }
    const updated = await this.repo.adjustStock(id, delta);
    if (!updated) throw new Error(`Failed to adjust stock for accessory id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<Accessory> {
    await this.getById(id);
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete accessory with id ${id}`);
    return deleted;
  }
}
