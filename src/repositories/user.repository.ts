import { eq } from "drizzle-orm";
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

  async findById(id: number): Promise<User | undefined> {
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

  async findByBranch(branchId: number): Promise<User[]> {
    return this.db
      .select()
      .from(users)
      .where(eq(users.branchId, branchId));
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateUser): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deactivate(id: number): Promise<User | undefined> {
    return this.update(id, { isActive: false });
  }

  async delete(id: number): Promise<User | undefined> {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}
