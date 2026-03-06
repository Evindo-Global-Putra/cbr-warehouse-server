import { WarehouseEntryRepository } from "../repositories/warehouse-entry.repository";
import { warehouseEntries } from "../db/schema";

type WarehouseEntry = typeof warehouseEntries.$inferSelect;
type NewWarehouseEntry = typeof warehouseEntries.$inferInsert;
type UpdateWarehouseEntry = Partial<
  Omit<NewWarehouseEntry, "id" | "createdAt">
>;

export class WarehouseEntryService {
  constructor(private repo: WarehouseEntryRepository) {}

  async getAll(): Promise<WarehouseEntry[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<WarehouseEntry> {
    const entry = await this.repo.findById(id);
    if (!entry) throw new Error(`Warehouse entry with id ${id} not found`);
    return entry;
  }

  async getByTravelPermit(travelPermitId: number): Promise<WarehouseEntry[]> {
    return this.repo.findByTravelPermit(travelPermitId);
  }

  async getByBranch(branchId: number): Promise<WarehouseEntry[]> {
    return this.repo.findByBranch(branchId);
  }

  async getByStatus(status: WarehouseEntry["status"]): Promise<WarehouseEntry[]> {
    return this.repo.findByStatus(status);
  }

  async create(data: NewWarehouseEntry): Promise<WarehouseEntry> {
    // One active entry per travel permit at a time
    const existing = await this.repo.findByTravelPermit(data.travelPermitId);
    const active = existing.find((e) => e.status === "in_progress");
    if (active) {
      throw new Error(
        `An in-progress warehouse entry already exists for travel permit id ${data.travelPermitId}`
      );
    }
    return this.repo.create(data);
  }

  // Called each time a motorcycle unit is successfully scanned.
  // Auto-completes the entry session when all expected units are scanned.
  async incrementScanned(id: number): Promise<WarehouseEntry> {
    const entry = await this.getById(id);

    if (entry.status === "completed") {
      throw new Error(`Warehouse entry with id ${id} is already completed`);
    }

    const updated = await this.repo.incrementScanned(id);
    if (!updated) throw new Error(`Failed to update warehouse entry with id ${id}`);

    // Auto-complete when all units are scanned
    if (updated.totalUnitsScanned >= updated.totalUnitsExpected) {
      return this.complete(id);
    }

    return updated;
  }

  async complete(id: number): Promise<WarehouseEntry> {
    const entry = await this.getById(id);
    if (entry.status === "completed") {
      throw new Error(`Warehouse entry with id ${id} is already completed`);
    }

    const updated = await this.repo.update(id, {
      status: "completed",
      completedAt: new Date(),
    });
    if (!updated) throw new Error(`Failed to complete warehouse entry with id ${id}`);
    return updated;
  }

  async update(id: number, data: UpdateWarehouseEntry): Promise<WarehouseEntry> {
    await this.getById(id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update warehouse entry with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<WarehouseEntry> {
    const entry = await this.getById(id);
    if (entry.status === "completed") {
      throw new Error(`Completed warehouse entries cannot be deleted`);
    }
    if (entry.totalUnitsScanned > 0) {
      throw new Error(
        `Cannot delete warehouse entry with id ${id}: ${entry.totalUnitsScanned} unit(s) already scanned`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete warehouse entry with id ${id}`);
    return deleted;
  }
}
