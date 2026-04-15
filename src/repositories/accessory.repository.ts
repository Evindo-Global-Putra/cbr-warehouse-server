import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
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

  async findPaginated(
    filters: { branchId?: string; category?: string; search?: string },
    page: number,
    limit: number
  ): Promise<{ data: Accessory[]; total: number }> {
    const conditions: SQL[] = [];
    if (filters.branchId) conditions.push(eq(accessories.branchId, filters.branchId));
    if (filters.category) conditions.push(ilike(accessories.category, filters.category));
    if (filters.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(accessories.name, pattern),
          ilike(accessories.sku, pattern)
        )!
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [data, [{ value: total }]] = await Promise.all([
      this.db.select().from(accessories).where(where).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(accessories).where(where),
    ]);
    return { data, total: Number(total) };
  }

  async findById(id: string): Promise<Accessory | undefined> {
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

  async findByBranch(branchId: string): Promise<Accessory[]> {
    return this.db
      .select()
      .from(accessories)
      .where(eq(accessories.branchId, branchId));
  }

  async create(data: NewAccessory): Promise<Accessory> {
    const result = await this.db.insert(accessories).values(data).returning();
    return result[0];
  }

  async update(id: string, data: UpdateAccessory): Promise<Accessory | undefined> {
    const result = await this.db
      .update(accessories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accessories.id, id))
      .returning();
    return result[0];
  }

  // Atomically adjust quantityInStock by delta (positive = add, negative = deduct)
  async adjustStock(id: string, delta: number): Promise<Accessory | undefined> {
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

  async delete(id: string): Promise<Accessory | undefined> {
    const result = await this.db
      .delete(accessories)
      .where(eq(accessories.id, id))
      .returning();
    return result[0];
  }
}
