import { BranchRepository } from "../repositories/branch.repository";
import { branches } from "../db/schema";

type Branch = typeof branches.$inferSelect;
type NewBranch = typeof branches.$inferInsert;
type UpdateBranch = Partial<Omit<NewBranch, "id" | "createdAt" | "updatedAt">>;

export class BranchService {
  constructor(private branchRepo: BranchRepository) {}

  async getAll(): Promise<Branch[]> {
    return this.branchRepo.findAll();
  }

  async getById(id: number): Promise<Branch> {
    const branch = await this.branchRepo.findById(id);
    if (!branch) throw new Error(`Branch with id ${id} not found`);
    return branch;
  }

  async getByCode(code: string): Promise<Branch> {
    const branch = await this.branchRepo.findByCode(code);
    if (!branch) throw new Error(`Branch with code "${code}" not found`);
    return branch;
  }

  async create(data: NewBranch): Promise<Branch> {
    const existing = await this.branchRepo.findByCode(data.code);
    if (existing) throw new Error(`Branch with code "${data.code}" already exists`);
    return this.branchRepo.create(data);
  }

  async update(id: number, data: UpdateBranch): Promise<Branch> {
    await this.getById(id);

    if (data.code) {
      const existing = await this.branchRepo.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error(`Branch with code "${data.code}" already exists`);
      }
    }

    const updated = await this.branchRepo.update(id, data);
    if (!updated) throw new Error(`Failed to update branch with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<Branch> {
    await this.getById(id);
    const deleted = await this.branchRepo.delete(id);
    if (!deleted) throw new Error(`Failed to delete branch with id ${id}`);
    return deleted;
  }
}
