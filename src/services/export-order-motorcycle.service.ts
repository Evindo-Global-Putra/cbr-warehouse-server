import { ExportOrderMotorcycleRepository } from "../repositories/export-order-motorcycle.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { exportOrderMotorcycles } from "../db/schema";

type ExportOrderMotorcycle = typeof exportOrderMotorcycles.$inferSelect;

export class ExportOrderMotorcycleService {
  constructor(
    private repo: ExportOrderMotorcycleRepository,
    private exportOrderRepo: ExportOrderRepository,
    private motorcycleRepo: MotorcycleRepository
  ) {}

  async getAll(): Promise<ExportOrderMotorcycle[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<ExportOrderMotorcycle> {
    const item = await this.repo.findById(id);
    if (!item) throw new Error(`Export order motorcycle assignment with id ${id} not found`);
    return item;
  }

  async getByExportOrder(exportOrderId: number): Promise<ExportOrderMotorcycle[]> {
    return this.repo.findByExportOrder(exportOrderId);
  }

  // Assign a motorcycle unit to an export order.
  // Validates the order is in an assignable state and the motorcycle is on_site.
  async assign(exportOrderId: number, motorcycleId: number): Promise<ExportOrderMotorcycle> {
    const order = await this.exportOrderRepo.findById(exportOrderId);
    if (!order) throw new Error(`Export order with id ${exportOrderId} not found`);
    if (!["pending", "confirmed", "in_progress"].includes(order.status)) {
      throw new Error(
        `Cannot assign motorcycles to an export order with status '${order.status}'`
      );
    }

    const motorcycle = await this.motorcycleRepo.findById(motorcycleId);
    if (!motorcycle) throw new Error(`Motorcycle with id ${motorcycleId} not found`);
    if (motorcycle.status !== "on_site") {
      throw new Error(
        `Motorcycle id ${motorcycleId} is not available (current status: '${motorcycle.status}')`
      );
    }

    const existing = await this.repo.findByMotorcycle(motorcycleId);
    if (existing) {
      throw new Error(
        `Motorcycle id ${motorcycleId} is already assigned to export order id ${existing.exportOrderId}`
      );
    }

    // Update motorcycle status to loading
    await this.motorcycleRepo.update(motorcycleId, { status: "loading" });

    return this.repo.create({ exportOrderId, motorcycleId });
  }

  // Remove a motorcycle assignment and revert its status back to on_site.
  async unassign(id: number): Promise<ExportOrderMotorcycle> {
    const assignment = await this.getById(id);

    // Revert motorcycle status
    await this.motorcycleRepo.update(assignment.motorcycleId, { status: "on_site" });

    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to remove assignment with id ${id}`);
    return deleted;
  }
}
