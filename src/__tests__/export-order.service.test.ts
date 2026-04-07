import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ExportOrderService } from "../services/export-order.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeOrder(status = "pending") {
  return {
    id: 1,
    orderNumber: "EXP-2025-001",
    clientId: 10,
    branchId: 1,
    status,
    requestedUnits: 50,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepo() {
  return {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined as any)),
    findByOrderNumber: mock(() => Promise.resolve(undefined as any)),
    findByClient: mock(() => Promise.resolve([])),
    findByBranch: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(makeOrder())),
    update: mock((_: number, data: any) => Promise.resolve({ ...makeOrder(), ...data })),
    delete: mock(() => Promise.resolve(makeOrder())),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ExportOrderService", () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: ExportOrderService;

  beforeEach(() => {
    repo = makeRepo();
    service = new ExportOrderService(repo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all export orders", async () => {
      const order = makeOrder();
      repo.findAll = mock(() => Promise.resolve([order]));
      expect(await service.getAll()).toEqual([order]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns order when found", async () => {
      const order = makeOrder();
      repo.findById = mock(() => Promise.resolve(order));
      expect(await service.getById(1)).toEqual(order);
    });

    it("throws when order not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByOrderNumber ───────────────────────────────────────────────────────

  describe("getByOrderNumber", () => {
    it("returns order when found by order number", async () => {
      const order = makeOrder();
      repo.findByOrderNumber = mock(() => Promise.resolve(order));
      expect(await service.getByOrderNumber("EXP-2025-001")).toEqual(order);
    });

    it("throws when order number not found", async () => {
      expect(service.getByOrderNumber("UNKNOWN")).rejects.toThrow("not found");
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates order when order number is unique", async () => {
      repo.findByOrderNumber = mock(() => Promise.resolve(undefined));
      const order = makeOrder();
      repo.create = mock(() => Promise.resolve(order));

      const result = await service.create({ orderNumber: "EXP-2025-001" } as any);
      expect(result).toEqual(order);
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it("throws when order number already exists", async () => {
      repo.findByOrderNumber = mock(() => Promise.resolve(makeOrder()));
      expect(
        service.create({ orderNumber: "EXP-2025-001" } as any)
      ).rejects.toThrow("already exists");
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────

  describe("updateStatus", () => {
    it("throws when order not found", async () => {
      expect(service.updateStatus(99, "confirmed")).rejects.toThrow("not found");
    });

    const validTransitions: Array<[string, string]> = [
      ["pending", "confirmed"],
      ["pending", "cancelled"],
      ["confirmed", "in_progress"],
      ["confirmed", "cancelled"],
      ["in_progress", "loading"],
      ["in_progress", "cancelled"],
      ["loading", "shipped"],
      ["shipped", "completed"],
    ];

    for (const [from, to] of validTransitions) {
      it(`allows transition from '${from}' to '${to}'`, async () => {
        repo.findById = mock(() => Promise.resolve(makeOrder(from)));
        repo.update = mock(() => Promise.resolve(makeOrder(to)));

        const result = await service.updateStatus(1, to as any);
        expect(result.status).toBe(to);
      });
    }

    const invalidTransitions: Array<[string, string]> = [
      ["pending", "in_progress"],
      ["pending", "loading"],
      ["pending", "shipped"],
      ["confirmed", "loading"],
      ["loading", "cancelled"],
      ["completed", "pending"],
      ["cancelled", "pending"],
    ];

    for (const [from, to] of invalidTransitions) {
      it(`rejects invalid transition from '${from}' to '${to}'`, async () => {
        repo.findById = mock(() => Promise.resolve(makeOrder(from)));

        expect(service.updateStatus(1, to as any)).rejects.toThrow("Cannot transition");
      });
    }
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when order not found", async () => {
      expect(service.update(99, { notes: "test" })).rejects.toThrow("not found");
    });

    it("updates order details", async () => {
      repo.findById = mock(() => Promise.resolve(makeOrder()));
      repo.update = mock(() =>
        Promise.resolve({ ...makeOrder(), notes: "Updated note" })
      );

      const result = await service.update(1, { notes: "Updated note" });
      expect(result.notes).toBe("Updated note");
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when order not found", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes pending order successfully", async () => {
      repo.findById = mock(() => Promise.resolve(makeOrder("pending")));
      repo.delete = mock(() => Promise.resolve(makeOrder("pending")));

      const result = await service.delete(1);
      expect(result.orderNumber).toBe("EXP-2025-001");
    });

    it("throws when attempting to delete a non-pending order", async () => {
      for (const status of ["confirmed", "in_progress", "loading", "shipped", "completed", "cancelled"]) {
        repo.findById = mock(() => Promise.resolve(makeOrder(status)));
        expect(service.delete(1)).rejects.toThrow("Only pending");
      }
    });
  });
});
