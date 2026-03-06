import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { WarehouseEntryRepository } from "../repositories/warehouse-entry.repository";
import { motorcycles } from "../db/schema";

type Motorcycle = typeof motorcycles.$inferSelect;
type NewMotorcycle = typeof motorcycles.$inferInsert;
type UpdateMotorcycle = Partial<
  Omit<NewMotorcycle, "id" | "createdAt" | "updatedAt">
>;

// Allowed status transitions based on business flow
const STATUS_TRANSITIONS: Record<
  Motorcycle["status"],
  Motorcycle["status"][]
> = {
  on_site: ["loading", "transferred"],
  loading: ["on_site", "exported"],   // on_site allows un-assigning from loading
  exported: [],
  transferred: [],
};

function generateNoInduk(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `NI-${ts}-${rand}`;
}

function generateBarcode(noInduk: string): string {
  return `BC-${noInduk}`;
}

export class MotorcycleService {
  constructor(
    private repo: MotorcycleRepository,
    private entryRepo: WarehouseEntryRepository
  ) {}

  async getAll(): Promise<Motorcycle[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Motorcycle> {
    const moto = await this.repo.findById(id);
    if (!moto) throw new Error(`Motorcycle with id ${id} not found`);
    return moto;
  }

  async getByBranch(branchId: number): Promise<Motorcycle[]> {
    return this.repo.findByBranch(branchId);
  }

  async getByStatus(status: Motorcycle["status"]): Promise<Motorcycle[]> {
    return this.repo.findByStatus(status);
  }

  async getByEntry(entryId: number): Promise<Motorcycle[]> {
    return this.repo.findByEntry(entryId);
  }

  async getByType(typeId: number): Promise<Motorcycle[]> {
    return this.repo.findByType(typeId);
  }

  async getByFrameNumber(frameNumber: string): Promise<Motorcycle> {
    const moto = await this.repo.findByFrameNumber(frameNumber);
    if (!moto) throw new Error(`Motorcycle with frame number "${frameNumber}" not found`);
    return moto;
  }

  async getByEngineNumber(engineNumber: string): Promise<Motorcycle> {
    const moto = await this.repo.findByEngineNumber(engineNumber);
    if (!moto) throw new Error(`Motorcycle with engine number "${engineNumber}" not found`);
    return moto;
  }

  async getByBarcode(barcode: string): Promise<Motorcycle> {
    const moto = await this.repo.findByBarcode(barcode);
    if (!moto) throw new Error(`Motorcycle with barcode "${barcode}" not found`);
    return moto;
  }

  // scan() is the core warehouse entry action (Steps 3–6 in the mobile flow).
  // It validates uniqueness, auto-generates noInduk & barcode, saves the unit,
  // then increments the parent entry's scanned count (auto-completing when done).
  async scan(
    data: Omit<NewMotorcycle, "noInduk" | "barcode">
  ): Promise<Motorcycle> {
    // Validate unique frame number
    const existingFrame = await this.repo.findByFrameNumber(data.frameNumber);
    if (existingFrame) {
      throw new Error(`Frame number "${data.frameNumber}" is already registered`);
    }

    // Validate unique engine number
    const existingEngine = await this.repo.findByEngineNumber(data.engineNumber);
    if (existingEngine) {
      throw new Error(`Engine number "${data.engineNumber}" is already registered`);
    }

    // Validate the entry session is still open
    if (data.entryId) {
      const entry = await this.entryRepo.findById(data.entryId);
      if (!entry) throw new Error(`Warehouse entry with id ${data.entryId} not found`);
      if (entry.status === "completed") {
        throw new Error(`Warehouse entry with id ${data.entryId} is already completed`);
      }
    }

    const noInduk = generateNoInduk();
    const barcode = generateBarcode(noInduk);

    const motorcycle = await this.repo.create({ ...data, noInduk, barcode });

    // Increment scanned count and auto-complete entry if all units done
    if (data.entryId) {
      const updated = await this.entryRepo.incrementScanned(data.entryId);
      if (updated && updated.totalUnitsScanned >= updated.totalUnitsExpected) {
        await this.entryRepo.update(data.entryId, {
          status: "completed",
          completedAt: new Date(),
        });
      }
    }

    return motorcycle;
  }

  async update(id: number, data: UpdateMotorcycle): Promise<Motorcycle> {
    await this.getById(id);

    if (data.frameNumber) {
      const existing = await this.repo.findByFrameNumber(data.frameNumber);
      if (existing && existing.id !== id) {
        throw new Error(`Frame number "${data.frameNumber}" is already registered`);
      }
    }
    if (data.engineNumber) {
      const existing = await this.repo.findByEngineNumber(data.engineNumber);
      if (existing && existing.id !== id) {
        throw new Error(`Engine number "${data.engineNumber}" is already registered`);
      }
    }

    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update motorcycle with id ${id}`);
    return updated;
  }

  async updateStatus(
    id: number,
    status: Motorcycle["status"]
  ): Promise<Motorcycle> {
    const moto = await this.getById(id);

    if (!STATUS_TRANSITIONS[moto.status].includes(status)) {
      throw new Error(
        `Cannot transition motorcycle status from "${moto.status}" to "${status}"`
      );
    }

    const updated = await this.repo.update(id, { status });
    if (!updated) throw new Error(`Failed to update status for motorcycle with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<Motorcycle> {
    const moto = await this.getById(id);
    if (moto.status !== "on_site") {
      throw new Error(
        `Only on-site motorcycles can be deleted (current status: "${moto.status}")`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete motorcycle with id ${id}`);
    return deleted;
  }
}
