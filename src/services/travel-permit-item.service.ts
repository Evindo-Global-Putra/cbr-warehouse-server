import { TravelPermitItemRepository } from "../repositories/travel-permit-item.repository";
import { TravelPermitItemReportRepository } from "../repositories/travel-permit-item-report.repository";
import { TravelPermitRepository } from "../repositories/travel-permit.repository";
import { travelPermitItems, travelPermitItemReports } from "../db/schema";

type TravelPermitItem = typeof travelPermitItems.$inferSelect;
type TravelPermitItemStatus = TravelPermitItem["status"];
type NewTravelPermitItem = typeof travelPermitItems.$inferInsert;
type NewReport = typeof travelPermitItemReports.$inferInsert;

export class TravelPermitItemService {
  constructor(
    private itemRepo: TravelPermitItemRepository,
    private reportRepo: TravelPermitItemReportRepository,
    private permitRepo: TravelPermitRepository,
  ) {}

  async getByPermitId(permitId: string): Promise<TravelPermitItem[]> {
    return this.itemRepo.findByTravelPermitId(permitId);
  }

  async getById(permitId: string, itemId: string): Promise<TravelPermitItem> {
    const item = await this.itemRepo.findById(itemId);
    if (!item || item.travelPermitId !== permitId) {
      throw new Error(`Travel permit item with id ${itemId} not found`);
    }
    return item;
  }

  async create(
    permitId: string,
    data: Omit<NewTravelPermitItem, "travelPermitId">
  ): Promise<TravelPermitItem> {
    const permit = await this.permitRepo.findById(permitId);
    if (!permit) throw new Error(`Travel permit with id ${permitId} not found`);
    if (permit.status !== "pending" && permit.status !== "received") {
      throw new Error(
        `Cannot add items to a permit with status "${permit.status}"`
      );
    }
    return this.itemRepo.create({ ...data, travelPermitId: permitId });
  }

  async update(
    permitId: string,
    itemId: string,
    data: Partial<Pick<TravelPermitItem, "motorcycleTypeId" | "color" | "quantity" | "notes">>
  ): Promise<TravelPermitItem> {
    const item = await this.getById(permitId, itemId);
    if (item.status === "done" || item.status === "cancelled") {
      throw new Error(`Cannot update a "${item.status}" item`);
    }
    const updated = await this.itemRepo.update(itemId, data);
    if (!updated) throw new Error(`Failed to update travel permit item with id ${itemId}`);
    return updated;
  }

  async updateStatus(
    permitId: string,
    itemId: string,
    status: TravelPermitItemStatus
  ): Promise<TravelPermitItem> {
    const item = await this.getById(permitId, itemId);

    const transitions: Record<TravelPermitItemStatus, TravelPermitItemStatus[]> = {
      checked: ["done", "reported", "cancelled"],
      reported: ["done", "checked"],
      done: ["checked"],
      cancelled: [],
    };

    if (!transitions[item.status].includes(status)) {
      throw new Error(
        `Cannot transition item from "${item.status}" to "${status}"`
      );
    }

    const updated = await this.itemRepo.updateStatus(itemId, status);
    if (!updated) throw new Error(`Failed to update status for travel permit item with id ${itemId}`);

    if (status === "done" || status === "cancelled") {
      await this.tryAutoValidatePermit(permitId);
    }

    return updated;
  }

  async delete(permitId: string, itemId: string): Promise<TravelPermitItem> {
    const item = await this.getById(permitId, itemId);
    if (item.status !== "checked") {
      throw new Error(`Only checked items can be deleted`);
    }
    const deleted = await this.itemRepo.delete(itemId);
    if (!deleted) throw new Error(`Failed to delete travel permit item with id ${itemId}`);
    return deleted;
  }

  async getReportsByItemId(permitId: string, itemId: string) {
    await this.getById(permitId, itemId); // ownership check
    return this.reportRepo.findByItemId(itemId);
  }

  async createReport(
    permitId: string,
    itemId: string,
    data: Omit<NewReport, "travelPermitItemId">
  ) {
    await this.getById(permitId, itemId); // ownership check
    return this.reportRepo.create({ ...data, travelPermitItemId: itemId });
  }

  // Auto-transition permit from received → validated when all items are resolved
  private async tryAutoValidatePermit(permitId: string): Promise<void> {
    const permit = await this.permitRepo.findById(permitId);
    if (!permit || permit.status !== "received") return;

    const items = await this.itemRepo.findByTravelPermitId(permitId);
    const allResolved =
      items.length > 0 &&
      items.every((i) => i.status === "done" || i.status === "cancelled");

    if (allResolved) {
      await this.permitRepo.update(permitId, { status: "validated" });
    }
  }
}
