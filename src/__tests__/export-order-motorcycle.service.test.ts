import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ExportOrderMotorcycleService } from "../services/export-order-motorcycle.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockOrder = { id: 1, status: "pending" } as any;

const mockMotorcycle = {
  id: 10,
  status: "on_site",
  frameNumber: "JH4TB2H26CC000001",
  engineNumber: "B3034-ABC",
} as any;

const mockAssignment = {
  id: 1,
  exportOrderId: 1,
  motorcycleId: 10,
  createdAt: new Date(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepos() {
  const assignmentRepo = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined as any)),
    findByExportOrder: mock(() => Promise.resolve([])),
    findByMotorcycle: mock(() => Promise.resolve(undefined as any)),
    create: mock(() => Promise.resolve(mockAssignment)),
    delete: mock(() => Promise.resolve(mockAssignment)),
  };
  const exportOrderRepo = {
    findById: mock(() => Promise.resolve(undefined as any)),
  };
  const motorcycleRepo = {
    findById: mock(() => Promise.resolve(undefined as any)),
    update: mock(() => Promise.resolve(mockMotorcycle)),
  };
  return { assignmentRepo, exportOrderRepo, motorcycleRepo };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ExportOrderMotorcycleService", () => {
  let assignmentRepo: ReturnType<typeof makeRepos>["assignmentRepo"];
  let exportOrderRepo: ReturnType<typeof makeRepos>["exportOrderRepo"];
  let motorcycleRepo: ReturnType<typeof makeRepos>["motorcycleRepo"];
  let service: ExportOrderMotorcycleService;

  beforeEach(() => {
    ({ assignmentRepo, exportOrderRepo, motorcycleRepo } = makeRepos());
    service = new ExportOrderMotorcycleService(
      assignmentRepo as any,
      exportOrderRepo as any,
      motorcycleRepo as any
    );
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all assignments", async () => {
      assignmentRepo.findAll = mock(() => Promise.resolve([mockAssignment]));
      expect(await service.getAll()).toEqual([mockAssignment]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns assignment when found", async () => {
      assignmentRepo.findById = mock(() => Promise.resolve(mockAssignment));
      expect(await service.getById(1)).toEqual(mockAssignment);
    });

    it("throws when assignment not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByExportOrder ───────────────────────────────────────────────────────

  describe("getByExportOrder", () => {
    it("returns assignments for an export order", async () => {
      assignmentRepo.findByExportOrder = mock(() =>
        Promise.resolve([mockAssignment])
      );
      const result = await service.getByExportOrder(1);
      expect(result).toEqual([mockAssignment]);
      expect(assignmentRepo.findByExportOrder).toHaveBeenCalledWith(1);
    });
  });

  // ── assign ─────────────────────────────────────────────────────────────────

  describe("assign", () => {
    it("throws when export order does not exist", async () => {
      expect(service.assign(99, 10)).rejects.toThrow("not found");
    });

    it("throws when order status is not assignable", async () => {
      for (const status of ["loading", "shipped", "completed", "cancelled"]) {
        exportOrderRepo.findById = mock(() =>
          Promise.resolve({ ...mockOrder, status })
        );

        expect(service.assign(1, 10)).rejects.toThrow("Cannot assign");
      }
    });

    it("throws when motorcycle does not exist", async () => {
      exportOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
      // motorcycleRepo.findById stays undefined

      expect(service.assign(1, 99)).rejects.toThrow("not found");
    });

    it("throws when motorcycle is not on_site", async () => {
      exportOrderRepo.findById = mock(() => Promise.resolve(mockOrder));

      for (const status of ["loading", "exported", "transferred"]) {
        motorcycleRepo.findById = mock(() =>
          Promise.resolve({ ...mockMotorcycle, status })
        );

        expect(service.assign(1, 10)).rejects.toThrow("not available");
      }
    });

    it("throws when motorcycle is already assigned", async () => {
      exportOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
      motorcycleRepo.findById = mock(() => Promise.resolve(mockMotorcycle));
      assignmentRepo.findByMotorcycle = mock(() =>
        Promise.resolve({ ...mockAssignment, exportOrderId: 2 })
      );

      expect(service.assign(1, 10)).rejects.toThrow("already assigned");
    });

    it("assigns motorcycle and sets status to loading", async () => {
      exportOrderRepo.findById = mock(() => Promise.resolve(mockOrder));
      motorcycleRepo.findById = mock(() => Promise.resolve(mockMotorcycle));
      assignmentRepo.findByMotorcycle = mock(() => Promise.resolve(undefined));
      assignmentRepo.create = mock(() => Promise.resolve(mockAssignment));

      const result = await service.assign(1, 10);
      expect(result).toEqual(mockAssignment);
      expect(motorcycleRepo.update).toHaveBeenCalledWith(10, { status: "loading" });
      expect(assignmentRepo.create).toHaveBeenCalledWith({
        exportOrderId: 1,
        motorcycleId: 10,
      });
    });

    it("allows assignment when order is confirmed or in_progress", async () => {
      for (const status of ["confirmed", "in_progress"]) {
        exportOrderRepo.findById = mock(() =>
          Promise.resolve({ ...mockOrder, status })
        );
        motorcycleRepo.findById = mock(() => Promise.resolve(mockMotorcycle));
        assignmentRepo.findByMotorcycle = mock(() => Promise.resolve(undefined));
        assignmentRepo.create = mock(() => Promise.resolve(mockAssignment));

        const result = await service.assign(1, 10);
        expect(result).toEqual(mockAssignment);
      }
    });
  });

  // ── unassign ───────────────────────────────────────────────────────────────

  describe("unassign", () => {
    it("throws when assignment not found", async () => {
      expect(service.unassign(99)).rejects.toThrow("not found");
    });

    it("reverts motorcycle status to on_site and removes assignment", async () => {
      assignmentRepo.findById = mock(() => Promise.resolve(mockAssignment));
      assignmentRepo.delete = mock(() => Promise.resolve(mockAssignment));

      const result = await service.unassign(1);
      expect(result).toEqual(mockAssignment);
      expect(motorcycleRepo.update).toHaveBeenCalledWith(10, { status: "on_site" });
      expect(assignmentRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
