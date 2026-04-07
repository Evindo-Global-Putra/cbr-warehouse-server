import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ExportOrderItemService } from "../services/export-order-item.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockOrder = { id: 1, status: "pending" } as any;

const mockItem = {
  id: 1,
  exportOrderId: 1,
  motorcycleTypeId: 2,
  accessoryId: null,
  quantity: 10,
  unitPrice: "1700.00",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAccessoryItem = {
  ...mockItem,
  id: 2,
  motorcycleTypeId: null,
  accessoryId: 5,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepos() {
  const itemRepo = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined as typeof mockItem | undefined)),
    findByExportOrder: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(mockItem)),
    update: mock((_: number, data: any) => Promise.resolve({ ...mockItem, ...data })),
    delete: mock(() => Promise.resolve(mockItem)),
  };
  const exportOrderRepo = {
    findById: mock(() => Promise.resolve(undefined as any)),
  };
  return { itemRepo, exportOrderRepo };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ExportOrderItemService", () => {
  let itemRepo: ReturnType<typeof makeRepos>["itemRepo"];
  let exportOrderRepo: ReturnType<typeof makeRepos>["exportOrderRepo"];
  let service: ExportOrderItemService;

  beforeEach(() => {
    ({ itemRepo, exportOrderRepo } = makeRepos());
    service = new ExportOrderItemService(itemRepo as any, exportOrderRepo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all export order items", async () => {
      itemRepo.findAll = mock(() => Promise.resolve([mockItem]));
      expect(await service.getAll()).toEqual([mockItem]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns item when found", async () => {
      itemRepo.findById = mock(() => Promise.resolve(mockItem));
      expect(await service.getById(1)).toEqual(mockItem);
    });

    it("throws when item not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByExportOrder ───────────────────────────────────────────────────────

  describe("getByExportOrder", () => {
    it("returns items for an export order", async () => {
      itemRepo.findByExportOrder = mock(() => Promise.resolve([mockItem]));
      const result = await service.getByExportOrder(1);
      expect(result).toEqual([mockItem]);
      expect(itemRepo.findByExportOrder).toHaveBeenCalledWith(1);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("throws when export order does not exist", async () => {
      expect(
        service.create({ exportOrderId: 99, motorcycleTypeId: 1 } as any)
      ).rejects.toThrow("not found");
    });

    it("throws when order status is not pending or confirmed", async () => {
      for (const status of ["in_progress", "loading", "shipped", "completed", "cancelled"]) {
        exportOrderRepo.findById = mock(() =>
          Promise.resolve({ ...mockOrder, status })
        );

        expect(
          service.create({
            exportOrderId: 1,
            motorcycleTypeId: 2,
            quantity: 5,
          } as any)
        ).rejects.toThrow(`Cannot add items`);
      }
    });

    it("creates item with motorcycleTypeId on pending order", async () => {
      exportOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
      itemRepo.create = mock(() => Promise.resolve(mockItem));

      const result = await service.create({
        exportOrderId: 1,
        motorcycleTypeId: 2,
        quantity: 10,
      } as any);
      expect(result).toEqual(mockItem);
    });

    it("creates item with accessoryId on confirmed order", async () => {
      exportOrderRepo.findById = mock(() =>
        Promise.resolve({ ...mockOrder, status: "confirmed" })
      );
      itemRepo.create = mock(() => Promise.resolve(mockAccessoryItem));

      const result = await service.create({
        exportOrderId: 1,
        accessoryId: 5,
        quantity: 20,
      } as any);
      expect(result).toEqual(mockAccessoryItem);
    });

    it("throws when neither motorcycleTypeId nor accessoryId is provided", async () => {
      exportOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

      expect(
        service.create({ exportOrderId: 1, quantity: 5 } as any)
      ).rejects.toThrow("must reference");
    });

    it("throws when both motorcycleTypeId and accessoryId are provided", async () => {
      exportOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

      expect(
        service.create({
          exportOrderId: 1,
          motorcycleTypeId: 2,
          accessoryId: 5,
          quantity: 5,
        } as any)
      ).rejects.toThrow("cannot reference both");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when item not found", async () => {
      expect(service.update(99, { quantity: 5 })).rejects.toThrow("not found");
    });

    it("updates item successfully", async () => {
      itemRepo.findById = mock(() => Promise.resolve(mockItem));
      itemRepo.update = mock(() =>
        Promise.resolve({ ...mockItem, quantity: 20 })
      );

      const result = await service.update(1, { quantity: 20 });
      expect(result.quantity).toBe(20);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when item not found", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes and returns deleted item", async () => {
      itemRepo.findById = mock(() => Promise.resolve(mockItem));
      itemRepo.delete = mock(() => Promise.resolve(mockItem));

      const result = await service.delete(1);
      expect(result).toEqual(mockItem);
      expect(itemRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
