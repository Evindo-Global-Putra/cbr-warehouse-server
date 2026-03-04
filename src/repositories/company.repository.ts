import { eq, ilike } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { companies } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Company = typeof companies.$inferSelect;
type NewCompany = typeof companies.$inferInsert;
type UpdateCompany = Partial<Omit<NewCompany, "id" | "createdAt" | "updatedAt">>;

export class CompanyRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Company[]> {
    return this.db.select().from(companies);
  }

  async findById(id: number): Promise<Company | undefined> {
    const result = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return result[0];
  }

  async findByNpwp(npwp: string): Promise<Company | undefined> {
    const result = await this.db
      .select()
      .from(companies)
      .where(eq(companies.npwp, npwp));
    return result[0];
  }

  async findByName(name: string): Promise<Company[]> {
    return this.db
      .select()
      .from(companies)
      .where(ilike(companies.name, `%${name}%`));
  }

  async findByCountry(country: string): Promise<Company[]> {
    return this.db
      .select()
      .from(companies)
      .where(eq(companies.country, country));
  }

  async create(data: NewCompany): Promise<Company> {
    const result = await this.db.insert(companies).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateCompany): Promise<Company | undefined> {
    const result = await this.db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<Company | undefined> {
    const result = await this.db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();
    return result[0];
  }
}
