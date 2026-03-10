import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { packingLists } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type PackingList = typeof packingLists.$inferSelect;
type NewPackingList = typeof packingLists.$inferInsert;
type UpdatePackingList = Partial<Omit<NewPackingList, "id" | "createdAt">>;

export class PackingListRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<PackingList[]> {
    return this.db.select().from(packingLists);
  }

  async findById(id: number): Promise<PackingList | undefined> {
    const result = await this.db
      .select()
      .from(packingLists)
      .where(eq(packingLists.id, id));
    return result[0];
  }

  async findByInvoice(invoiceId: number): Promise<PackingList | undefined> {
    const result = await this.db
      .select()
      .from(packingLists)
      .where(eq(packingLists.invoiceId, invoiceId));
    return result[0];
  }

  async create(data: NewPackingList): Promise<PackingList> {
    const result = await this.db.insert(packingLists).values(data).returning();
    return result[0];
  }

  async update(
    id: number,
    data: UpdatePackingList
  ): Promise<PackingList | undefined> {
    const result = await this.db
      .update(packingLists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(packingLists.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<PackingList | undefined> {
    const result = await this.db
      .delete(packingLists)
      .where(eq(packingLists.id, id))
      .returning();
    return result[0];
  }
}
