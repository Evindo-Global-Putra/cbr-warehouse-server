import { UserRepository } from "../repositories/user.repository";
import { users } from "../db/schema";

type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
type UpdateUser = Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>;

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getAll(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async getById(id: number): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error(`User with id ${id} not found`);
    return user;
  }

  async getByEmail(email: string): Promise<User> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error(`User with email "${email}" not found`);
    return user;
  }

  async getByRole(role: User["role"]): Promise<User[]> {
    return this.userRepo.findByRole(role);
  }

  async getByBranch(branchId: number): Promise<User[]> {
    return this.userRepo.findByBranch(branchId);
  }

  async create(data: NewUser): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new Error(`User with email "${data.email}" already exists`);
    return this.userRepo.create(data);
  }

  async update(id: number, data: UpdateUser): Promise<User> {
    await this.getById(id);

    if (data.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new Error(`Email "${data.email}" is already taken`);
      }
    }

    const updated = await this.userRepo.update(id, data);
    if (!updated) throw new Error(`Failed to update user with id ${id}`);
    return updated;
  }

  async deactivate(id: number): Promise<User> {
    await this.getById(id);
    const updated = await this.userRepo.deactivate(id);
    if (!updated) throw new Error(`Failed to deactivate user with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<User> {
    await this.getById(id);
    const deleted = await this.userRepo.delete(id);
    if (!deleted) throw new Error(`Failed to delete user with id ${id}`);
    return deleted;
  }
}
