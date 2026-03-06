import { ExportOrderItemRepository } from "../repositories/export-order-item.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { exportOrderItems } from "../db/schema";

type ExportOrderItem = typeof exportOrderItems.$inferSelect;
type NewExportOrderItem = typeof exportOrderItems.$inferInsert;
type UpdateExportOrderItem = Partial<Omit<NewExportOrderItem, "id">>;

export class ExportOrderItemService {
  constructor(
    private repo: ExportOrderItemRepository,
    private exportOrderRepo: ExportOrderRepository
  ) {}

  async getAll(): Promise<ExportOrderItem[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<ExportOrderItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new Error(`Export order item with id ${id} not found`);
    return item;
  }

  async getByExportOrder(exportOrderId: number): Promise<ExportOrderItem[]> {
    return this.repo.findByExportOrder(exportOrderId);
  }

  async create(data: NewExportOrderItem): Promise<ExportOrderItem> {
    const order = await this.exportOrderRepo.findById(data.exportOrderId);
    if (!order) {
      throw new Error(`Export order with id ${data.exportOrderId} not found`);
    }
    if (order.status !== "pending" && order.status !== "confirmed") {
      throw new Error(
        `Cannot add items to an export order with status '${order.status}'`
      );
    }
    return this.repo.create(data);
  }

  async update(id: number, data: UpdateExportOrderItem): Promise<ExportOrderItem> {
    await this.getById(id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update export order item with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<ExportOrderItem> {
    await this.getById(id);
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete export order item with id ${id}`);
    return deleted;
  }
}
