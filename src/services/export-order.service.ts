import { ExportOrderRepository } from "../repositories/export-order.repository";
import { exportOrders } from "../db/schema";

type ExportOrder = typeof exportOrders.$inferSelect;
type NewExportOrder = typeof exportOrders.$inferInsert;
type UpdateExportOrder = Partial<Omit<NewExportOrder, "id" | "createdAt">>;

// Valid forward-only status transitions
const STATUS_TRANSITIONS: Record<ExportOrder["status"], ExportOrder["status"][]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["loading", "cancelled"],
  loading: ["shipped"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export class ExportOrderService {
  constructor(private repo: ExportOrderRepository) {}

  async getAll(): Promise<ExportOrder[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<ExportOrder> {
    const order = await this.repo.findById(id);
    if (!order) throw new Error(`Export order with id ${id} not found`);
    return order;
  }

  async getByOrderNumber(orderNumber: string): Promise<ExportOrder> {
    const order = await this.repo.findByOrderNumber(orderNumber);
    if (!order) throw new Error(`Export order '${orderNumber}' not found`);
    return order;
  }

  async getByClient(clientId: number): Promise<ExportOrder[]> {
    return this.repo.findByClient(clientId);
  }

  async getByBranch(branchId: number): Promise<ExportOrder[]> {
    return this.repo.findByBranch(branchId);
  }

  async getByStatus(status: ExportOrder["status"]): Promise<ExportOrder[]> {
    return this.repo.findByStatus(status);
  }

  async create(data: NewExportOrder): Promise<ExportOrder> {
    const existing = await this.repo.findByOrderNumber(data.orderNumber);
    if (existing) {
      throw new Error(`Export order '${data.orderNumber}' already exists`);
    }
    return this.repo.create(data);
  }

  async updateStatus(id: number, newStatus: ExportOrder["status"]): Promise<ExportOrder> {
    const order = await this.getById(id);
    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot transition export order from '${order.status}' to '${newStatus}'`
      );
    }
    const updated = await this.repo.update(id, { status: newStatus });
    if (!updated) throw new Error(`Failed to update export order with id ${id}`);
    return updated;
  }

  async update(id: number, data: UpdateExportOrder): Promise<ExportOrder> {
    await this.getById(id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update export order with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<ExportOrder> {
    const order = await this.getById(id);
    if (order.status !== "pending") {
      throw new Error(
        `Only pending export orders can be deleted (current status: '${order.status}')`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete export order with id ${id}`);
    return deleted;
  }
}
