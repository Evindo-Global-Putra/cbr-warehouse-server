import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { accessories } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Accessory = typeof accessories.$inferSelect;
type NewAccessory = typeof accessories.$inferInsert;
type UpdateAccessory = Partial<Omit<NewAccessory, "id" | "createdAt">>;

export class AccessoryRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Accessory[]> {
    return this.db.select().from(accessories);
  }

  async findById(id: number): Promise<Accessory | undefined> {
    const result = await this.db
      .select()
      .from(accessories)
      .where(eq(accessories.id, id));
    return result[0];
  }

  async findBySku(sku: string): Promise<Accessory | undefined> {
    const result = await this.db
      .select()
      .from(accessories)
      .where(eq(accessories.sku, sku));
    return result[0];
  }

  async findByBranch(branchId: number): Promise<Accessory[]> {
    return this.db
      .select()
      .from(accessories)
      .where(eq(accessories.branchId, branchId));
  }

  async create(data: NewAccessory): Promise<Accessory> {
    const result = await this.db.insert(accessories).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateAccessory): Promise<Accessory | undefined> {
    const result = await this.db
      .update(accessories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accessories.id, id))
      .returning();
    return result[0];
  }

  // Atomically adjust quantityInStock by delta (positive = add, negative = deduct)
  async adjustStock(id: number, delta: number): Promise<Accessory | undefined> {
    const result = await this.db
      .update(accessories)
      .set({
        quantityInStock: sql`${accessories.quantityInStock} + ${delta}`,
        updatedAt: new Date(),
      })
      .where(eq(accessories.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<Accessory | undefined> {
    const result = await this.db
      .delete(accessories)
      .where(eq(accessories.id, id))
      .returning();
    return result[0];
  }
}
