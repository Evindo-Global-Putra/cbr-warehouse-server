import { LoadingFormRepository } from "../repositories/loading-form.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { loadingForms } from "../db/schema";

type LoadingForm = typeof loadingForms.$inferSelect;
type NewLoadingForm = typeof loadingForms.$inferInsert;
type UpdateLoadingForm = Partial<Omit<NewLoadingForm, "id" | "createdAt">>;

export class LoadingFormService {
  constructor(
    private repo: LoadingFormRepository,
    private exportOrderRepo: ExportOrderRepository
  ) {}

  async getAll(): Promise<LoadingForm[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<LoadingForm> {
    const form = await this.repo.findById(id);
    if (!form) throw new Error(`Loading form with id ${id} not found`);
    return form;
  }

  async getByExportOrder(exportOrderId: number): Promise<LoadingForm[]> {
    return this.repo.findByExportOrder(exportOrderId);
  }

  async getByBranch(branchId: number): Promise<LoadingForm[]> {
    return this.repo.findByBranch(branchId);
  }

  async getByStatus(status: LoadingForm["status"]): Promise<LoadingForm[]> {
    return this.repo.findByStatus(status);
  }

  async create(data: NewLoadingForm): Promise<LoadingForm> {
    const order = await this.exportOrderRepo.findById(data.exportOrderId);
    if (!order) {
      throw new Error(`Export order with id ${data.exportOrderId} not found`);
    }
    if (!["confirmed", "in_progress"].includes(order.status)) {
      throw new Error(
        `Cannot create a loading form for an export order with status '${order.status}'`
      );
    }
    return this.repo.create(data);
  }

  // Advance draft → confirmed
  async confirm(id: number): Promise<LoadingForm> {
    const form = await this.getById(id);
    if (form.status !== "draft") {
      throw new Error(
        `Loading form id ${id} cannot be confirmed (current status: '${form.status}')`
      );
    }
    const updated = await this.repo.update(id, { status: "confirmed" });
    if (!updated) throw new Error(`Failed to confirm loading form with id ${id}`);
    return updated;
  }

  // Advance confirmed → validated; also update the linked export order to 'loading'
  async validate(id: number, validatedById: number): Promise<LoadingForm> {
    const form = await this.getById(id);
    if (form.status !== "confirmed") {
      throw new Error(
        `Loading form id ${id} cannot be validated (current status: '${form.status}')`
      );
    }

    const updated = await this.repo.update(id, {
      status: "validated",
      validatedById,
    });
    if (!updated) throw new Error(`Failed to validate loading form with id ${id}`);

    // Reflect loading status on the export order
    await this.exportOrderRepo.update(form.exportOrderId, { status: "loading" });

    return updated;
  }

  async update(id: number, data: UpdateLoadingForm): Promise<LoadingForm> {
    const form = await this.getById(id);
    if (form.status !== "draft") {
      throw new Error(
        `Loading form id ${id} can only be edited while in draft status`
      );
    }
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update loading form with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<LoadingForm> {
    const form = await this.getById(id);
    if (form.status !== "draft") {
      throw new Error(
        `Only draft loading forms can be deleted (current status: '${form.status}')`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete loading form with id ${id}`);
    return deleted;
  }
}
