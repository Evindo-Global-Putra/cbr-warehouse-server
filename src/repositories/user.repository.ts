import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { users } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
type UpdateUser = Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>;

export class UserRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findById(id: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return result[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result[0];
  }

  async findByRole(role: User["role"]): Promise<User[]> {
    return this.db.select().from(users).where(eq(users.role, role));
  }

  async findByBranch(branchId: string): Promise<User[]> {
    return this.db
      .select()
      .from(users)
      .where(eq(users.branchId, branchId));
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: string, data: UpdateUser): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async incrementTokenVersion(id: string): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deactivate(id: string): Promise<User | undefined> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<User | undefined> {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}
