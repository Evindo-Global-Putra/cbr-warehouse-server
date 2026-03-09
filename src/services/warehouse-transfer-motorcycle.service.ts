import { WarehouseTransferMotorcycleRepository } from "../repositories/warehouse-transfer-motorcycle.repository";
import { WarehouseTransferRepository } from "../repositories/warehouse-transfer.repository";
import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { warehouseTransferMotorcycles } from "../db/schema";

type WTM = typeof warehouseTransferMotorcycles.$inferSelect;
type NewWTM = typeof warehouseTransferMotorcycles.$inferInsert;

export class WarehouseTransferMotorcycleService {
  constructor(
    private repo: WarehouseTransferMotorcycleRepository,
    private transferRepo: WarehouseTransferRepository,
    private motorcycleRepo: MotorcycleRepository
  ) {}

  async getByTransfer(transferId: number): Promise<WTM[]> {
    return this.repo.findByTransfer(transferId);
  }

  async getByMotorcycle(motorcycleId: number): Promise<WTM[]> {
    return this.repo.findByMotorcycle(motorcycleId);
  }

  async getById(id: number): Promise<WTM> {
    const item = await this.repo.findById(id);
    if (!item) throw new Error(`Transfer motorcycle record with id ${id} not found`);
    return item;
  }

  async addMotorcycle(data: NewWTM): Promise<WTM> {
    const transfer = await this.transferRepo.findById(data.transferId);
    if (!transfer) {
      throw new Error(`Warehouse transfer with id ${data.transferId} not found`);
    }
    if (transfer.status !== "pending") {
      throw new Error(
        `Cannot add motorcycles to a transfer that is not pending (current status: '${transfer.status}')`
      );
    }

    const motorcycle = await this.motorcycleRepo.findById(data.motorcycleId);
    if (!motorcycle) {
      throw new Error(`Motorcycle with id ${data.motorcycleId} not found`);
    }
    if (motorcycle.status !== "on_site") {
      throw new Error(
        `Motorcycle id ${data.motorcycleId} is not available for transfer (current status: '${motorcycle.status}')`
      );
    }
    if (motorcycle.branchId !== transfer.fromBranchId) {
      throw new Error(
        `Motorcycle id ${data.motorcycleId} is not at the source branch of this transfer`
      );
    }

    return this.repo.create(data);
  }

  async removeMotorcycle(transferId: number, motorcycleId: number): Promise<WTM> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) {
      throw new Error(`Warehouse transfer with id ${transferId} not found`);
    }
    if (transfer.status !== "pending") {
      throw new Error(
        `Cannot remove motorcycles from a transfer that is not pending (current status: '${transfer.status}')`
      );
    }

    const deleted = await this.repo.deleteByTransferAndMotorcycle(transferId, motorcycleId);
    if (!deleted) {
      throw new Error(
        `Motorcycle id ${motorcycleId} is not part of transfer id ${transferId}`
      );
    }
    return deleted;
  }

  async delete(id: number): Promise<WTM> {
    const item = await this.getById(id);
    const transfer = await this.transferRepo.findById(item.transferId);
    if (transfer?.status !== "pending") {
      throw new Error(
        `Cannot remove motorcycles from a transfer that is not pending (current status: '${transfer?.status}')`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete transfer motorcycle record with id ${id}`);
    return deleted;
  }
}
