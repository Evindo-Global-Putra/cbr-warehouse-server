import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { travelPermitItems } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type TravelPermitItem = typeof travelPermitItems.$inferSelect;
type NewTravelPermitItem = typeof travelPermitItems.$inferInsert;
type UpdateTravelPermitItem = Partial<
  Omit<NewTravelPermitItem, "id" | "travelPermitId" | "createdAt" | "updatedAt">
>;

export class TravelPermitItemRepository {
  constructor(private db: DB) {}

  async findByTravelPermitId(travelPermitId: string): Promise<TravelPermitItem[]> {
    return this.db
      .select()
      .from(travelPermitItems)
      .where(eq(travelPermitItems.travelPermitId, travelPermitId as string));
  }

  async findById(id: string): Promise<TravelPermitItem | undefined> {
    const result = await this.db
      .select()
      .from(travelPermitItems)
      .where(eq(travelPermitItems.id, id));
    return result[0];
  }

  async create(data: NewTravelPermitItem): Promise<TravelPermitItem> {
    const result = await this.db
      .insert(travelPermitItems)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: UpdateTravelPermitItem
  ): Promise<TravelPermitItem | undefined> {
    const result = await this.db
      .update(travelPermitItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(travelPermitItems.id, id))
      .returning();
    return result[0];
  }

  async updateStatus(
    id: string,
    status: TravelPermitItem["status"]
  ): Promise<TravelPermitItem | undefined> {
    const result = await this.db
      .update(travelPermitItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(travelPermitItems.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<TravelPermitItem | undefined> {
    const result = await this.db
      .delete(travelPermitItems)
      .where(eq(travelPermitItems.id, id))
      .returning();
    return result[0];
  }
}
