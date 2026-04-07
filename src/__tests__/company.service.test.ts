import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CompanyService } from "../services/company.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockCompany = {
  id: 1,
  name: "PT. Maju Bersama",
  npwp: "01.234.567.8-901.000",
  address: "Jl. Sudirman No. 1",
  country: "Indonesia",
  phone: "+62-21-1234567",
  email: "info@majubersama.co.id",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepo() {
  return {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined as typeof mockCompany | undefined)),
    findByNpwp: mock(() => Promise.resolve(undefined as typeof mockCompany | undefined)),
    findByName: mock(() => Promise.resolve([])),
    findByCountry: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(mockCompany)),
    update: mock((_: number, data: any) => Promise.resolve({ ...mockCompany, ...data })),
    delete: mock(() => Promise.resolve(mockCompany)),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CompanyService", () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: CompanyService;

  beforeEach(() => {
    repo = makeRepo();
    service = new CompanyService(repo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all companies", async () => {
      repo.findAll = mock(() => Promise.resolve([mockCompany]));
      expect(await service.getAll()).toEqual([mockCompany]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns company when found", async () => {
      repo.findById = mock(() => Promise.resolve(mockCompany));
      expect(await service.getById(1)).toEqual(mockCompany);
    });

    it("throws when company not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByNpwp ──────────────────────────────────────────────────────────────

  describe("getByNpwp", () => {
    it("returns company when found by NPWP", async () => {
      repo.findByNpwp = mock(() => Promise.resolve(mockCompany));
      expect(await service.getByNpwp("01.234.567.8-901.000")).toEqual(mockCompany);
    });

    it("throws when NPWP not found", async () => {
      expect(service.getByNpwp("00.000.000.0-000.000")).rejects.toThrow("not found");
    });
  });

  // ── search ─────────────────────────────────────────────────────────────────

  describe("search", () => {
    it("returns matching companies", async () => {
      repo.findByName = mock(() => Promise.resolve([mockCompany]));
      const result = await service.search("Maju");
      expect(result).toEqual([mockCompany]);
      expect(repo.findByName).toHaveBeenCalledWith("Maju");
    });

    it("returns empty array when no match", async () => {
      repo.findByName = mock(() => Promise.resolve([]));
      expect(await service.search("Nonexistent")).toEqual([]);
    });
  });

  // ── getByCountry ───────────────────────────────────────────────────────────

  describe("getByCountry", () => {
    it("returns companies for a country", async () => {
      repo.findByCountry = mock(() => Promise.resolve([mockCompany]));
      expect(await service.getByCountry("Indonesia")).toEqual([mockCompany]);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates company when NPWP is unique", async () => {
      repo.findByNpwp = mock(() => Promise.resolve(undefined));
      repo.create = mock(() => Promise.resolve(mockCompany));

      const result = await service.create({ ...mockCompany } as any);
      expect(result).toEqual(mockCompany);
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it("throws when NPWP already exists", async () => {
      repo.findByNpwp = mock(() => Promise.resolve(mockCompany));
      expect(
        service.create({ ...mockCompany } as any)
      ).rejects.toThrow("already exists");
    });

    it("creates company without NPWP without uniqueness check", async () => {
      const noNpwp = { ...mockCompany, npwp: null };
      repo.create = mock(() => Promise.resolve(noNpwp as any));

      const result = await service.create({ ...mockCompany, npwp: null } as any);
      expect(result).toEqual(noNpwp);
      // findByNpwp should NOT be called when npwp is null
      expect(repo.findByNpwp).not.toHaveBeenCalled();
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when company not found", async () => {
      expect(service.update(99, { name: "New Name" })).rejects.toThrow("not found");
    });

    it("updates company successfully", async () => {
      repo.findById = mock(() => Promise.resolve(mockCompany));
      repo.update = mock(() => Promise.resolve({ ...mockCompany, name: "PT. Baru" }));

      const result = await service.update(1, { name: "PT. Baru" });
      expect(result.name).toBe("PT. Baru");
    });

    it("throws when NPWP belongs to a different company", async () => {
      const other = { ...mockCompany, id: 2, npwp: "99.999.999.9-999.000" };
      repo.findById = mock(() => Promise.resolve(mockCompany));
      repo.findByNpwp = mock(() => Promise.resolve(other));

      expect(
        service.update(1, { npwp: "99.999.999.9-999.000" })
      ).rejects.toThrow("already registered");
    });

    it("allows updating NPWP to same company's current NPWP", async () => {
      repo.findById = mock(() => Promise.resolve(mockCompany));
      repo.findByNpwp = mock(() => Promise.resolve(mockCompany)); // same company
      repo.update = mock(() => Promise.resolve(mockCompany));

      const result = await service.update(1, { npwp: mockCompany.npwp });
      expect(result).toEqual(mockCompany);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when company not found", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes and returns deleted company", async () => {
      repo.findById = mock(() => Promise.resolve(mockCompany));
      repo.delete = mock(() => Promise.resolve(mockCompany));

      const result = await service.delete(1);
      expect(result).toEqual(mockCompany);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
