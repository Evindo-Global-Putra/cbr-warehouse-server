import { eq, ilike } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { suppliers } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Supplier = typeof suppliers.$inferSelect;
type NewSupplier = typeof suppliers.$inferInsert;
type UpdateSupplier = Partial<Omit<NewSupplier, "id" | "createdAt" | "updatedAt">>;

export class SupplierRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Supplier[]> {
    return this.db.select().from(suppliers);
  }

  async findById(id: number): Promise<Supplier | undefined> {
    const result = await this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id));
    return result[0];
  }

  async findByName(name: string): Promise<Supplier[]> {
    return this.db
      .select()
      .from(suppliers)
      .where(ilike(suppliers.name, `%${name}%`));
  }

  async findByCountry(country: string): Promise<Supplier[]> {
    return this.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.country, country));
  }

  async create(data: NewSupplier): Promise<Supplier> {
    const result = await this.db.insert(suppliers).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateSupplier): Promise<Supplier | undefined> {
    const result = await this.db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<Supplier | undefined> {
    const result = await this.db
      .delete(suppliers)
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }
}
