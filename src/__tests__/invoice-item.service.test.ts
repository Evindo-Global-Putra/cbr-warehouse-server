import { describe, it, expect, mock, beforeEach } from "bun:test";
import { InvoiceItemService } from "../services/invoice-item.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const invoiceDraft = { id: 1, status: "draft" } as any;
const invoiceSent = { id: 2, status: "sent" } as any;

const baseItem = {
  id: 1,
  invoiceId: 1,
  description: "YAMAHA NMAX NEO (KEY)",
  motorcycleTypeId: null,
  accessoryId: null,
  quantity: 10,
  unitPrice: "1700.00",
  amount: "17000.00",
  sortOrder: 0,
} as any;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepos(overrides: { itemRepo?: any; invoiceRepo?: any } = {}) {
  const itemRepo = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined)),
    findByInvoice: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(baseItem)),
    update: mock((_, data: any) => Promise.resolve({ ...baseItem, ...data })),
    delete: mock(() => Promise.resolve(baseItem)),
    ...overrides.itemRepo,
  };
  const invoiceRepo = {
    findById: mock(() => Promise.resolve(undefined)),
    ...overrides.invoiceRepo,
  };
  return { itemRepo, invoiceRepo };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InvoiceItemService", () => {
  let itemRepo: ReturnType<typeof makeRepos>["itemRepo"];
  let invoiceRepo: ReturnType<typeof makeRepos>["invoiceRepo"];
  let service: InvoiceItemService;

  beforeEach(() => {
    ({ itemRepo, invoiceRepo } = makeRepos());
    service = new InvoiceItemService(itemRepo as any, invoiceRepo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all items from repo", async () => {
      itemRepo.findAll = mock(() => Promise.resolve([baseItem]));
      const result = await service.getAll();
      expect(result).toEqual([baseItem]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns item when found", async () => {
      itemRepo.findById = mock(() => Promise.resolve(baseItem));
      expect(await service.getById(1)).toEqual(baseItem);
    });

    it("throws when item does not exist", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByInvoice ───────────────────────────────────────────────────────────

  describe("getByInvoice", () => {
    it("returns ordered items for the given invoice", async () => {
      itemRepo.findByInvoice = mock(() => Promise.resolve([baseItem]));
      const result = await service.getByInvoice(1);
      expect(result).toEqual([baseItem]);
      expect(itemRepo.findByInvoice).toHaveBeenCalledWith(1);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    const input = {
      invoiceId: 1,
      description: "YAMAHA NMAX NEO (KEY)",
      quantity: 10,
      unitPrice: "1700.00",
    } as any;

    it("throws when invoice does not exist", async () => {
      expect(service.create(input)).rejects.toThrow("not found");
    });

    it("throws when invoice is not draft", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceSent));
      expect(
        service.create({ ...input, invoiceId: 2 })
      ).rejects.toThrow("Cannot add items");
    });

    it("auto-computes amount = quantity × unitPrice", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceDraft));
      let captured: any;
      itemRepo.create = mock((data: any) => {
        captured = data;
        return Promise.resolve({ ...data });
      });

      await service.create(input);
      expect(captured.amount).toBe("17000.00");
    });

    it("computes amount correctly for fractional prices (helmets example)", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceDraft));
      let captured: any;
      itemRepo.create = mock((data: any) => {
        captured = data;
        return Promise.resolve({ ...data });
      });

      await service.create({ invoiceId: 1, description: "HELMETS", quantity: 56, unitPrice: "10.00" });
      expect(captured.amount).toBe("560.00");
    });

    it("does not include amount in the input passed to repo (auto-set)", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceDraft));
      let captured: any;
      itemRepo.create = mock((data: any) => {
        captured = data;
        return Promise.resolve({ ...data });
      });

      await service.create(input);
      // amount must be in the data sent to repo (it was computed and merged)
      expect(captured).toHaveProperty("amount");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    beforeEach(() => {
      itemRepo.findById = mock(() => Promise.resolve(baseItem));
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceDraft));
    });

    it("throws when item does not exist", async () => {
      itemRepo.findById = mock(() => Promise.resolve(undefined));
      expect(service.update(99, {})).rejects.toThrow("not found");
    });

    it("throws when invoice is not draft", async () => {
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceSent));
      expect(service.update(1, { quantity: 5 })).rejects.toThrow("Cannot modify");
    });

    it("recomputes amount when quantity changes", async () => {
      let patch: any;
      itemRepo.update = mock((_, data: any) => {
        patch = data;
        return Promise.resolve({ ...baseItem, ...data });
      });

      await service.update(1, { quantity: 20 });
      expect(patch.amount).toBe("34000.00"); // 20 × 1700
    });

    it("recomputes amount when unitPrice changes", async () => {
      let patch: any;
      itemRepo.update = mock((_, data: any) => {
        patch = data;
        return Promise.resolve({ ...baseItem, ...data });
      });

      await service.update(1, { unitPrice: "1770.00" });
      expect(patch.amount).toBe("17700.00"); // 10 × 1770
    });

    it("recomputes amount when both quantity and unitPrice change", async () => {
      let patch: any;
      itemRepo.update = mock((_, data: any) => {
        patch = data;
        return Promise.resolve({ ...baseItem, ...data });
      });

      await service.update(1, { quantity: 21, unitPrice: "1770.00" });
      expect(patch.amount).toBe("37170.00"); // 21 × 1770
    });

    it("does not set amount when only description changes", async () => {
      let patch: any;
      itemRepo.update = mock((_, data: any) => {
        patch = data;
        return Promise.resolve({ ...baseItem, ...data });
      });

      await service.update(1, { description: "YAMAHA NMAX NEO (KEYLESS)" });
      expect(patch.amount).toBeUndefined();
    });

    it("does not set amount when only sortOrder changes", async () => {
      let patch: any;
      itemRepo.update = mock((_, data: any) => {
        patch = data;
        return Promise.resolve({ ...baseItem, ...data });
      });

      await service.update(1, { sortOrder: 5 });
      expect(patch.amount).toBeUndefined();
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when item does not exist", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("throws when invoice is not draft", async () => {
      itemRepo.findById = mock(() => Promise.resolve({ ...baseItem, invoiceId: 2 }));
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceSent));
      expect(service.delete(1)).rejects.toThrow("Cannot delete");
    });

    it("deletes item successfully when invoice is draft", async () => {
      itemRepo.findById = mock(() => Promise.resolve(baseItem));
      invoiceRepo.findById = mock(() => Promise.resolve(invoiceDraft));
      itemRepo.delete = mock(() => Promise.resolve(baseItem));

      const result = await service.delete(1);
      expect(result).toEqual(baseItem);
      expect(itemRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
