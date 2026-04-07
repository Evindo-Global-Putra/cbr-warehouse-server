import { describe, it, expect, mock, beforeEach } from "bun:test";
import { AccessoryService } from "../services/accessory.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockAccessory = {
  id: 1,
  branchId: 1,
  sku: "HLM-001",
  name: "Helmet Full-Face",
  category: "helmet",
  quantityInStock: 50,
  unitPrice: "10.00",
  grossWeightPerUnit: "2.00",
  netWeightPerUnit: "1.80",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepo() {
  return {
    findAll: mock(() => Promise.resolve([])),
    findPaginated: mock(() => Promise.resolve({ data: [], total: 0 })),
    findById: mock(() => Promise.resolve(undefined as typeof mockAccessory | undefined)),
    findBySku: mock(() => Promise.resolve(undefined as typeof mockAccessory | undefined)),
    findByBranch: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(mockAccessory)),
    update: mock((_: number, data: any) => Promise.resolve({ ...mockAccessory, ...data })),
    adjustStock: mock(() => Promise.resolve(mockAccessory)),
    delete: mock(() => Promise.resolve(mockAccessory)),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AccessoryService", () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: AccessoryService;

  beforeEach(() => {
    repo = makeRepo();
    service = new AccessoryService(repo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all accessories", async () => {
      repo.findAll = mock(() => Promise.resolve([mockAccessory]));
      expect(await service.getAll()).toEqual([mockAccessory]);
    });
  });

  // ── getPaginated ───────────────────────────────────────────────────────────

  describe("getPaginated", () => {
    it("returns paginated data with meta", async () => {
      repo.findPaginated = mock(() =>
        Promise.resolve({ data: [mockAccessory], total: 1 })
      );

      const result = await service.getPaginated({}, 1, 10);
      expect(result.data).toEqual([mockAccessory]);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it("calculates totalPages correctly", async () => {
      repo.findPaginated = mock(() =>
        Promise.resolve({ data: [], total: 25 })
      );

      const result = await service.getPaginated({}, 1, 10);
      expect(result.meta.totalPages).toBe(3);
    });

    it("passes filters through to repo", async () => {
      const filters = { branchId: 2, category: "helmet", search: "full" };
      await service.getPaginated(filters, 2, 5);
      expect(repo.findPaginated).toHaveBeenCalledWith(filters, 2, 5);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns accessory when found", async () => {
      repo.findById = mock(() => Promise.resolve(mockAccessory));
      expect(await service.getById(1)).toEqual(mockAccessory);
    });

    it("throws when accessory not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getBySku ───────────────────────────────────────────────────────────────

  describe("getBySku", () => {
    it("returns accessory when found by SKU", async () => {
      repo.findBySku = mock(() => Promise.resolve(mockAccessory));
      expect(await service.getBySku("HLM-001")).toEqual(mockAccessory);
    });

    it("throws when SKU not found", async () => {
      expect(service.getBySku("UNKNOWN-SKU")).rejects.toThrow("not found");
    });
  });

  // ── getByBranch ────────────────────────────────────────────────────────────

  describe("getByBranch", () => {
    it("returns accessories for a branch", async () => {
      repo.findByBranch = mock(() => Promise.resolve([mockAccessory]));
      expect(await service.getByBranch(1)).toEqual([mockAccessory]);
      expect(repo.findByBranch).toHaveBeenCalledWith(1);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates accessory when SKU is unique", async () => {
      repo.findBySku = mock(() => Promise.resolve(undefined));
      repo.create = mock(() => Promise.resolve(mockAccessory));

      const result = await service.create({ ...mockAccessory } as any);
      expect(result).toEqual(mockAccessory);
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it("throws when SKU already exists", async () => {
      repo.findBySku = mock(() => Promise.resolve(mockAccessory));
      expect(
        service.create({ ...mockAccessory } as any)
      ).rejects.toThrow("already exists");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when accessory not found", async () => {
      expect(service.update(99, { name: "New Name" })).rejects.toThrow("not found");
    });

    it("updates and returns the updated accessory", async () => {
      repo.findById = mock(() => Promise.resolve(mockAccessory));
      repo.update = mock(() => Promise.resolve({ ...mockAccessory, name: "Updated Helmet" }));

      const result = await service.update(1, { name: "Updated Helmet" });
      expect(result.name).toBe("Updated Helmet");
    });
  });

  // ── adjustStock ────────────────────────────────────────────────────────────

  describe("adjustStock", () => {
    it("throws when accessory not found", async () => {
      expect(service.adjustStock(99, 5)).rejects.toThrow("not found");
    });

    it("adds stock successfully", async () => {
      repo.findById = mock(() => Promise.resolve(mockAccessory)); // quantityInStock: 50
      const updated = { ...mockAccessory, quantityInStock: 55 };
      repo.adjustStock = mock(() => Promise.resolve(updated));

      const result = await service.adjustStock(1, 5);
      expect(result.quantityInStock).toBe(55);
      expect(repo.adjustStock).toHaveBeenCalledWith(1, 5);
    });

    it("deducts stock successfully", async () => {
      repo.findById = mock(() => Promise.resolve(mockAccessory)); // quantityInStock: 50
      const updated = { ...mockAccessory, quantityInStock: 40 };
      repo.adjustStock = mock(() => Promise.resolve(updated));

      const result = await service.adjustStock(1, -10);
      expect(result.quantityInStock).toBe(40);
    });

    it("throws when deduction would result in negative stock", async () => {
      repo.findById = mock(() => Promise.resolve(mockAccessory)); // quantityInStock: 50

      expect(service.adjustStock(1, -51)).rejects.toThrow("Insufficient stock");
    });

    it("allows deducting exactly to zero", async () => {
      repo.findById = mock(() => Promise.resolve(mockAccessory)); // quantityInStock: 50
      const updated = { ...mockAccessory, quantityInStock: 0 };
      repo.adjustStock = mock(() => Promise.resolve(updated));

      const result = await service.adjustStock(1, -50);
      expect(result.quantityInStock).toBe(0);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when accessory not found", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes and returns deleted accessory", async () => {
      repo.findById = mock(() => Promise.resolve(mockAccessory));
      repo.delete = mock(() => Promise.resolve(mockAccessory));

      const result = await service.delete(1);
      expect(result).toEqual(mockAccessory);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
