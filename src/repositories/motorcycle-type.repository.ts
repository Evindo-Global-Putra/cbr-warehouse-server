import { and, eq, ilike, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { motorcycleTypes } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type MotorcycleType = typeof motorcycleTypes.$inferSelect;
type NewMotorcycleType = typeof motorcycleTypes.$inferInsert;
type UpdateMotorcycleType = Partial<
  Omit<NewMotorcycleType, "id" | "createdAt" | "updatedAt">
>;

export class MotorcycleTypeRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<MotorcycleType[]> {
    return this.db.select().from(motorcycleTypes);
  }

  async findById(id: number): Promise<MotorcycleType | undefined> {
    const result = await this.db
      .select()
      .from(motorcycleTypes)
      .where(eq(motorcycleTypes.id, id));
    return result[0];
  }

  async findByBrand(brand: string): Promise<MotorcycleType[]> {
    return this.db
      .select()
      .from(motorcycleTypes)
      .where(ilike(motorcycleTypes.brand, brand));
  }

  async findByBrandModelAndVariant(
    brand: string,
    model: string,
    variant?: string | null
  ): Promise<MotorcycleType | undefined> {
    const result = await this.db
      .select()
      .from(motorcycleTypes)
      .where(
        and(
          eq(motorcycleTypes.brand, brand),
          eq(motorcycleTypes.model, model),
          variant != null
            ? eq(motorcycleTypes.variant, variant)
            : sql`${motorcycleTypes.variant} is null`
        )
      );
    return result[0];
  }

  async create(data: NewMotorcycleType): Promise<MotorcycleType> {
    const result = await this.db
      .insert(motorcycleTypes)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: number,
    data: UpdateMotorcycleType
  ): Promise<MotorcycleType | undefined> {
    const result = await this.db
      .update(motorcycleTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(motorcycleTypes.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<MotorcycleType | undefined> {
    const result = await this.db
      .delete(motorcycleTypes)
      .where(eq(motorcycleTypes.id, id))
      .returning();
    return result[0];
  }
}
