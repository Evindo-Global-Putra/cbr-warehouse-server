import { describe, it, expect, mock, beforeEach } from "bun:test";
import { PackingListService } from "../services/packing-list.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockInvoice = { id: 1, status: "draft" } as any;

const mockPL = {
  id: 1,
  invoiceId: 1,
  shippingTerm: "CNF BEIRUT",
  totalQuantity: 0,
  totalGrossWeight: null,
  totalNetWeight: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepos() {
  const plRepo = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined)),
    findByInvoice: mock(() => Promise.resolve(undefined)),
    create: mock(() => Promise.resolve(mockPL)),
    update: mock((_, data: any) => Promise.resolve({ ...mockPL, ...data })),
    delete: mock(() => Promise.resolve(mockPL)),
  };
  const invoiceRepo = {
    findById: mock(() => Promise.resolve(undefined)),
  };
  return { plRepo, invoiceRepo };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PackingListService", () => {
  let plRepo: ReturnType<typeof makeRepos>["plRepo"];
  let invoiceRepo: ReturnType<typeof makeRepos>["invoiceRepo"];
  let service: PackingListService;

  beforeEach(() => {
    ({ plRepo, invoiceRepo } = makeRepos());
    service = new PackingListService(plRepo as any, invoiceRepo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all packing lists from repo", async () => {
      plRepo.findAll = mock(() => Promise.resolve([mockPL]));
      expect(await service.getAll()).toEqual([mockPL]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns packing list when found", async () => {
      plRepo.findById = mock(() => Promise.resolve(mockPL));
      expect(await service.getById(1)).toEqual(mockPL);
    });

    it("throws when not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByInvoice ───────────────────────────────────────────────────────────

  describe("getByInvoice", () => {
    it("returns packing list for invoice", async () => {
      plRepo.findByInvoice = mock(() => Promise.resolve(mockPL));
      expect(await service.getByInvoice(1)).toEqual(mockPL);
      expect(plRepo.findByInvoice).toHaveBeenCalledWith(1);
    });

    it("throws when no packing list exists for the invoice", async () => {
      expect(service.getByInvoice(99)).rejects.toThrow("not found");
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("throws when invoice does not exist", async () => {
      expect(
        service.create({ invoiceId: 99 } as any)
      ).rejects.toThrow("not found");
    });

    it("enforces 1:1 — throws when a packing list already exists for the invoice", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(mockInvoice));
      plRepo.findByInvoice = mock(() => Promise.resolve(mockPL));

      expect(
        service.create({ invoiceId: 1 } as any)
      ).rejects.toThrow("already exists");
    });

    it("creates packing list when invoice exists and no duplicate", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(mockInvoice));
      plRepo.findByInvoice = mock(() => Promise.resolve(undefined));
      plRepo.create = mock(() => Promise.resolve(mockPL));

      const result = await service.create({ invoiceId: 1, shippingTerm: "CNF BEIRUT" } as any);
      expect(result).toEqual(mockPL);
      expect(plRepo.create).toHaveBeenCalledTimes(1);
    });

    it("passes shippingTerm through to repo", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(mockInvoice));
      plRepo.findByInvoice = mock(() => Promise.resolve(undefined));
      let capturedData: any;
      plRepo.create = mock((data: any) => {
        capturedData = data;
        return Promise.resolve(mockPL);
      });

      await service.create({ invoiceId: 1, shippingTerm: "FOB JAKARTA" } as any);
      expect(capturedData.shippingTerm).toBe("FOB JAKARTA");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when packing list not found", async () => {
      expect(service.update(99, {})).rejects.toThrow("not found");
    });

    it("updates and returns the updated packing list", async () => {
      plRepo.findById = mock(() => Promise.resolve(mockPL));
      plRepo.update = mock(() =>
        Promise.resolve({ ...mockPL, shippingTerm: "FOB JAKARTA" })
      );

      const result = await service.update(1, { shippingTerm: "FOB JAKARTA" });
      expect(result.shippingTerm).toBe("FOB JAKARTA");
      expect(plRepo.update).toHaveBeenCalledWith(1, { shippingTerm: "FOB JAKARTA" });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when not found", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes and returns the deleted record", async () => {
      plRepo.findById = mock(() => Promise.resolve(mockPL));
      plRepo.delete = mock(() => Promise.resolve(mockPL));

      const result = await service.delete(1);
      expect(result).toEqual(mockPL);
      expect(plRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
