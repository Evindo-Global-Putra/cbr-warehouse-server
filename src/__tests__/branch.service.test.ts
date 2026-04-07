import { describe, it, expect, mock, beforeEach } from "bun:test";
import { BranchService } from "../services/branch.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockBranch = {
  id: 1,
  name: "Jakarta",
  code: "JKT",
  address: "Jl. Kapuk Muara, Jakarta Utara",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepo() {
  return {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined as typeof mockBranch | undefined)),
    findByCode: mock(() => Promise.resolve(undefined as typeof mockBranch | undefined)),
    create: mock(() => Promise.resolve(mockBranch)),
    update: mock((_: number, data: any) => Promise.resolve({ ...mockBranch, ...data })),
    delete: mock(() => Promise.resolve(mockBranch)),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("BranchService", () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: BranchService;

  beforeEach(() => {
    repo = makeRepo();
    service = new BranchService(repo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all branches", async () => {
      repo.findAll = mock(() => Promise.resolve([mockBranch]));
      expect(await service.getAll()).toEqual([mockBranch]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns branch when found", async () => {
      repo.findById = mock(() => Promise.resolve(mockBranch));
      expect(await service.getById(1)).toEqual(mockBranch);
    });

    it("throws when branch not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByCode ──────────────────────────────────────────────────────────────

  describe("getByCode", () => {
    it("returns branch when found by code", async () => {
      repo.findByCode = mock(() => Promise.resolve(mockBranch));
      expect(await service.getByCode("JKT")).toEqual(mockBranch);
    });

    it("throws when code not found", async () => {
      expect(service.getByCode("XXX")).rejects.toThrow("not found");
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates branch when code is unique", async () => {
      repo.findByCode = mock(() => Promise.resolve(undefined));
      repo.create = mock(() => Promise.resolve(mockBranch));

      const result = await service.create({ name: "Jakarta", code: "JKT" } as any);
      expect(result).toEqual(mockBranch);
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it("throws when code already exists", async () => {
      repo.findByCode = mock(() => Promise.resolve(mockBranch));
      expect(
        service.create({ name: "Duplicate", code: "JKT" } as any)
      ).rejects.toThrow("already exists");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when branch not found", async () => {
      expect(service.update(99, { name: "New Name" })).rejects.toThrow("not found");
    });

    it("updates branch successfully", async () => {
      repo.findById = mock(() => Promise.resolve(mockBranch));
      repo.update = mock(() => Promise.resolve({ ...mockBranch, name: "Surabaya" }));

      const result = await service.update(1, { name: "Surabaya" });
      expect(result.name).toBe("Surabaya");
    });

    it("throws when updating code to one that belongs to a different branch", async () => {
      const otherBranch = { ...mockBranch, id: 2, code: "SBY" };
      repo.findById = mock(() => Promise.resolve(mockBranch));
      repo.findByCode = mock(() => Promise.resolve(otherBranch));

      expect(service.update(1, { code: "SBY" })).rejects.toThrow("already exists");
    });

    it("allows updating code to same branch's current code", async () => {
      repo.findById = mock(() => Promise.resolve(mockBranch));
      repo.findByCode = mock(() => Promise.resolve(mockBranch)); // same branch
      repo.update = mock(() => Promise.resolve(mockBranch));

      const result = await service.update(1, { code: "JKT" });
      expect(result).toEqual(mockBranch);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when branch not found", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes and returns deleted branch", async () => {
      repo.findById = mock(() => Promise.resolve(mockBranch));
      repo.delete = mock(() => Promise.resolve(mockBranch));

      const result = await service.delete(1);
      expect(result).toEqual(mockBranch);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
