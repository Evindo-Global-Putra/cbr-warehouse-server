import { TravelPermitRepository } from "../repositories/travel-permit.repository";
import { travelPermits } from "../db/schema";

type TravelPermit = typeof travelPermits.$inferSelect;
type NewTravelPermit = typeof travelPermits.$inferInsert;
type UpdateTravelPermit = Partial<Omit<NewTravelPermit, "id" | "createdAt" | "updatedAt">>;

export class TravelPermitService {
  constructor(private repo: TravelPermitRepository) {}

  async getAll() {
    return this.repo.findAllWithRelations();
  }

  async getById(id: string) {
    const permit = await this.repo.findByIdWithRelations(id);
    if (!permit) throw new Error(`Travel permit with id ${id} not found`);
    return permit;
  }

  async getByPermitNumber(permitNumber: string): Promise<TravelPermit> {
    const permit = await this.repo.findByPermitNumber(permitNumber);
    if (!permit) throw new Error(`Travel permit "${permitNumber}" not found`);
    return permit;
  }

  async getBySupplier(supplierId: string): Promise<TravelPermit[]> {
    return this.repo.findBySupplier(supplierId);
  }

  async getByBranch(branchId: string): Promise<TravelPermit[]> {
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

  async update(id: string, data: UpdateTravelPermit): Promise<TravelPermit> {
    await this.repo.findById(id).then((p) => {
      if (!p) throw new Error(`Travel permit with id ${id} not found`);
    });

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

  async updateStatus(id: string, status: TravelPermit["status"]): Promise<TravelPermit> {
    const permit = await this.repo.findById(id);
    if (!permit) throw new Error(`Travel permit with id ${id} not found`);

    // Enforce valid status transitions: pending → received → validated → sent → completed
    const transitions: Record<TravelPermit["status"], TravelPermit["status"][]> = {
      pending: ["received"],
      received: ["validated"],
      validated: ["sent"],
      sent: ["completed"],
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

  // "Send to Staff" action: validated → sent
  // Requires all items to be done or cancelled — no checked/reported allowed
  async sendToStaff(id: string, sentById: string): Promise<TravelPermit> {
    const permit = await this.repo.findByIdWithRelations(id);
    if (!permit) throw new Error(`Travel permit with id ${id} not found`);

    if (permit.status !== "validated") {
      throw new Error(
        `Only validated permits can be sent to staff (current status: "${permit.status}")`
      );
    }

    const hasUnresolved = permit.items.some(
      (item) => item.status === "checked" || item.status === "reported"
    );
    if (hasUnresolved) {
      throw new Error(
        `Cannot send to staff: all items must be confirmed or cancelled first`
      );
    }

    const updated = await this.repo.update(id, {
      status: "sent",
      sentAt: new Date(),
      sentById,
    });
    if (!updated) throw new Error(`Failed to send travel permit with id ${id} to staff`);
    return updated;
  }

  async delete(id: string): Promise<TravelPermit> {
    const permit = await this.repo.findById(id);
    if (!permit) throw new Error(`Travel permit with id ${id} not found`);
    if (permit.status !== "pending") {
      throw new Error(`Only pending travel permits can be deleted`);
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete travel permit with id ${id}`);
    return deleted;
  }
}
