import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { packingListItems } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type PackingListItem = typeof packingListItems.$inferSelect;
type NewPackingListItem = typeof packingListItems.$inferInsert;
type UpdatePackingListItem = Partial<Omit<NewPackingListItem, "id">>;

export class PackingListItemRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<PackingListItem[]> {
    return this.db.select().from(packingListItems);
  }

  async findById(id: number): Promise<PackingListItem | undefined> {
    const result = await this.db
      .select()
      .from(packingListItems)
      .where(eq(packingListItems.id, id));
    return result[0];
  }

  async findByPackingList(packingListId: number): Promise<PackingListItem[]> {
    return this.db
      .select()
      .from(packingListItems)
      .where(eq(packingListItems.packingListId, packingListId))
      .orderBy(packingListItems.sortOrder);
  }

  async create(data: NewPackingListItem): Promise<PackingListItem> {
    const result = await this.db
      .insert(packingListItems)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: number,
    data: UpdatePackingListItem
  ): Promise<PackingListItem | undefined> {
    const result = await this.db
      .update(packingListItems)
      .set(data)
      .where(eq(packingListItems.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<PackingListItem | undefined> {
    const result = await this.db
      .delete(packingListItems)
      .where(eq(packingListItems.id, id))
      .returning();
    return result[0];
  }
}
