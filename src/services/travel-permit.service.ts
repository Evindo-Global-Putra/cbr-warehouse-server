import { TravelPermitRepository } from "../repositories/travel-permit.repository";
import { travelPermits } from "../db/schema";

type TravelPermit = typeof travelPermits.$inferSelect;
type NewTravelPermit = typeof travelPermits.$inferInsert;
type UpdateTravelPermit = Partial<Omit<NewTravelPermit, "id" | "createdAt" | "updatedAt">>;

export class TravelPermitService {
  constructor(private repo: TravelPermitRepository) {}

  async getAll(): Promise<TravelPermit[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<TravelPermit> {
    const permit = await this.repo.findById(id);
    if (!permit) throw new Error(`Travel permit with id ${id} not found`);
    return permit;
  }

  async getByPermitNumber(permitNumber: string): Promise<TravelPermit> {
    const permit = await this.repo.findByPermitNumber(permitNumber);
    if (!permit) throw new Error(`Travel permit "${permitNumber}" not found`);
    return permit;
  }

  async getBySupplier(supplierId: number): Promise<TravelPermit[]> {
    return this.repo.findBySupplier(supplierId);
  }

  async getByBranch(branchId: number): Promise<TravelPermit[]> {
    return this.repo.findByBranch(branchId);
  }

  async getByStatus(status: TravelPermit["status"]): Promise<TravelPermit[]> {
    return this.repo.findByStatus(status);
  }

  async create(data: NewTravelPermit): Promise<TravelPermit> {
    const existing = await this.repo.findByPermitNumber(data.permitNumber);
    if (existing) {
      throw new Error(`Travel permit number "${data.permitNumber}" already exists`);
    }
    return this.repo.create(data);
  }

  async update(id: number, data: UpdateTravelPermit): Promise<TravelPermit> {
    await this.getById(id);

    if (data.permitNumber) {
      const existing = await this.repo.findByPermitNumber(data.permitNumber);
      if (existing && existing.id !== id) {
        throw new Error(`Travel permit number "${data.permitNumber}" already exists`);
      }
    }

    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update travel permit with id ${id}`);
    return updated;
  }

  async updateStatus(id: number, status: TravelPermit["status"]): Promise<TravelPermit> {
    const permit = await this.getById(id);

    // Enforce valid status transitions: pending → received → completed
    const transitions: Record<TravelPermit["status"], TravelPermit["status"][]> = {
      pending: ["received"],
      received: ["completed"],
      completed: [],
    };

    if (!transitions[permit.status].includes(status)) {
      throw new Error(
        `Cannot transition travel permit from "${permit.status}" to "${status}"`
      );
    }

    const updated = await this.repo.update(id, {
      status,
      ...(status === "received" ? { receivedDate: new Date() } : {}),
    });
    if (!updated) throw new Error(`Failed to update status for travel permit with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<TravelPermit> {
    const permit = await this.getById(id);
    if (permit.status !== "pending") {
      throw new Error(`Only pending travel permits can be deleted`);
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete travel permit with id ${id}`);
    return deleted;
  }
}
