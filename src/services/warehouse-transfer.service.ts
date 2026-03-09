import { WarehouseTransferRepository } from "../repositories/warehouse-transfer.repository";
import { WarehouseTransferMotorcycleRepository } from "../repositories/warehouse-transfer-motorcycle.repository";
import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { warehouseTransfers } from "../db/schema";

type WarehouseTransfer = typeof warehouseTransfers.$inferSelect;
type NewWarehouseTransfer = typeof warehouseTransfers.$inferInsert;

export class WarehouseTransferService {
  constructor(
    private repo: WarehouseTransferRepository,
    private wtmRepo: WarehouseTransferMotorcycleRepository,
    private motorcycleRepo: MotorcycleRepository
  ) {}

  async getAll(): Promise<WarehouseTransfer[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<WarehouseTransfer> {
    const transfer = await this.repo.findById(id);
    if (!transfer) throw new Error(`Warehouse transfer with id ${id} not found`);
    return transfer;
  }

  async getByFromBranch(fromBranchId: number): Promise<WarehouseTransfer[]> {
    return this.repo.findByFromBranch(fromBranchId);
  }

  async getByToBranch(toBranchId: number): Promise<WarehouseTransfer[]> {
    return this.repo.findByToBranch(toBranchId);
  }

  async getByStatus(status: WarehouseTransfer["status"]): Promise<WarehouseTransfer[]> {
    return this.repo.findByStatus(status);
  }

  async create(data: NewWarehouseTransfer): Promise<WarehouseTransfer> {
    if (data.fromBranchId === data.toBranchId) {
      throw new Error(`Source and destination branch cannot be the same`);
    }
    return this.repo.create(data);
  }

  async markInTransit(id: number): Promise<WarehouseTransfer> {
    const transfer = await this.getById(id);
    if (transfer.status !== "pending") {
      throw new Error(
        `Transfer id ${id} cannot be marked in-transit (current status: '${transfer.status}')`
      );
    }

    // Mark all motorcycles in this transfer as "transferred"
    const items = await this.wtmRepo.findByTransfer(id);
    for (const item of items) {
      await this.motorcycleRepo.update(item.motorcycleId, { status: "transferred" });
    }

    const updated = await this.repo.update(id, { status: "in_transit" });
    if (!updated) throw new Error(`Failed to update transfer with id ${id}`);
    return updated;
  }

  async complete(id: number): Promise<WarehouseTransfer> {
    const transfer = await this.getById(id);
    if (transfer.status !== "in_transit") {
      throw new Error(
        `Transfer id ${id} cannot be completed (current status: '${transfer.status}')`
      );
    }

    // Move all motorcycles to the destination branch and set status back to on_site
    const items = await this.wtmRepo.findByTransfer(id);
    for (const item of items) {
      await this.motorcycleRepo.update(item.motorcycleId, {
        status: "on_site",
        branchId: transfer.toBranchId,
      });
    }

    const updated = await this.repo.update(id, {
      status: "completed",
      completedAt: new Date(),
    });
    if (!updated) throw new Error(`Failed to update transfer with id ${id}`);
    return updated;
  }

  async cancel(id: number): Promise<WarehouseTransfer> {
    const transfer = await this.getById(id);
    if (transfer.status === "completed" || transfer.status === "cancelled") {
      throw new Error(
        `Transfer id ${id} cannot be cancelled (current status: '${transfer.status}')`
      );
    }

    // If already in_transit, restore motorcycle statuses to on_site
    if (transfer.status === "in_transit") {
      const items = await this.wtmRepo.findByTransfer(id);
      for (const item of items) {
        await this.motorcycleRepo.update(item.motorcycleId, { status: "on_site" });
      }
    }

    const updated = await this.repo.update(id, { status: "cancelled" });
    if (!updated) throw new Error(`Failed to update transfer with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<WarehouseTransfer> {
    const transfer = await this.getById(id);
    if (transfer.status !== "pending") {
      throw new Error(
        `Only pending transfers can be deleted (current status: '${transfer.status}')`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete transfer with id ${id}`);
    return deleted;
  }
}
