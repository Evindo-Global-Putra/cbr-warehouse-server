import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { branches } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Branch = typeof branches.$inferSelect;
type NewBranch = typeof branches.$inferInsert;
type UpdateBranch = Partial<Omit<NewBranch, "id" | "createdAt" | "updatedAt">>;

export class BranchRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Branch[]> {
    return this.db.select().from(branches);
  }

  async findById(id: number): Promise<Branch | undefined> {
    const result = await this.db
      .select()
      .from(branches)
      .where(eq(branches.id, id));
    return result[0];
  }

  async findByCode(code: string): Promise<Branch | undefined> {
    const result = await this.db
      .select()
      .from(branches)
      .where(eq(branches.code, code));
    return result[0];
  }

  async create(data: NewBranch): Promise<Branch> {
    const result = await this.db.insert(branches).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateBranch): Promise<Branch | undefined> {
    const result = await this.db
      .update(branches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<Branch | undefined> {
    const result = await this.db
      .delete(branches)
      .where(eq(branches.id, id))
      .returning();
    return result[0];
  }
}
