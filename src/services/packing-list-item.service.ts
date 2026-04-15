import { PackingListItemRepository } from "../repositories/packing-list-item.repository";
import { PackingListRepository } from "../repositories/packing-list.repository";
import { packingListItems } from "../db/schema";

type PackingListItem = typeof packingListItems.$inferSelect;
type NewPackingListItem = typeof packingListItems.$inferInsert;
type UpdatePackingListItem = Partial<Omit<NewPackingListItem, "id">>;

export class PackingListItemService {
  constructor(
    private repo: PackingListItemRepository,
    private packingListRepo: PackingListRepository
  ) {}

  // Recompute and persist totalQuantity, totalGrossWeight, totalNetWeight
  // on the parent packing list after any item mutation.
  private async recalculateTotals(packingListId: string): Promise<void> {
    const items = await this.repo.findByPackingList(packingListId);
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalGrossWeight = items
      .reduce((sum, i) => sum + parseFloat(i.grossWeight), 0)
      .toFixed(2);
    const totalNetWeight = items
      .reduce((sum, i) => sum + parseFloat(i.netWeight), 0)
      .toFixed(2);
    await this.packingListRepo.update(packingListId, {
      totalQuantity,
      totalGrossWeight,
      totalNetWeight,
    });
  }

  async getAll(): Promise<PackingListItem[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<PackingListItem> {
    const item = await this.repo.findById(id);
    if (!item) throw new Error(`Packing list item with id ${id} not found`);
    return item;
  }

  async getByPackingList(packingListId: string): Promise<PackingListItem[]> {
    return this.repo.findByPackingList(packingListId);
  }

  async create(data: NewPackingListItem): Promise<PackingListItem> {
    const pl = await this.packingListRepo.findById(data.packingListId);
    if (!pl) {
      throw new Error(`Packing list with id ${data.packingListId} not found`);
    }
    const created = await this.repo.create(data);
    await this.recalculateTotals(data.packingListId);
    return created;
  }

  async update(
    id: string,
    data: UpdatePackingListItem
  ): Promise<PackingListItem> {
    const item = await this.getById(id);
    const updated = await this.repo.update(id, data);
    if (!updated)
      throw new Error(`Failed to update packing list item with id ${id}`);
    await this.recalculateTotals(item.packingListId);
    return updated;
  }

  async delete(id: string): Promise<PackingListItem> {
    const item = await this.getById(id);
    const deleted = await this.repo.delete(id);
    if (!deleted)
      throw new Error(`Failed to delete packing list item with id ${id}`);
    await this.recalculateTotals(item.packingListId);
    return deleted;
  }
}
