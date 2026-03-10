import { describe, it, expect, mock, beforeEach } from "bun:test";
import { PackingListItemService } from "../services/packing-list-item.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockPL = {
  id: 1,
  invoiceId: 1,
  totalQuantity: 0,
  totalGrossWeight: null,
  totalNetWeight: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

// Real numbers from CLAUDE.md packing list example
const itemNmaxKey = {
  id: 1,
  packingListId: 1,
  description: "YAMAHA NMAX NEO (KEY)",
  motorcycleTypeId: null,
  accessoryId: null,
  quantity: 20,
  grossWeight: "2660.00",
  netWeight: "2740.00",
  sortOrder: 0,
} as any;

const itemNmaxKeyless = {
  id: 2,
  packingListId: 1,
  description: "YAMAHA NMAX NEO (KEYLESS)",
  motorcycleTypeId: null,
  accessoryId: null,
  quantity: 21,
  grossWeight: "2793.00",
  netWeight: "2877.00",
  sortOrder: 1,
} as any;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepos() {
  const itemRepo = {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined)),
    findByPackingList: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(itemNmaxKey)),
    update: mock((_, data: any) => Promise.resolve({ ...itemNmaxKey, ...data })),
    delete: mock(() => Promise.resolve(itemNmaxKey)),
  };
  const plRepo = {
    findById: mock(() => Promise.resolve(undefined)),
    update: mock(() => Promise.resolve(mockPL)),
  };
  return { itemRepo, plRepo };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PackingListItemService", () => {
  let itemRepo: ReturnType<typeof makeRepos>["itemRepo"];
  let plRepo: ReturnType<typeof makeRepos>["plRepo"];
  let service: PackingListItemService;

  beforeEach(() => {
    ({ itemRepo, plRepo } = makeRepos());
    service = new PackingListItemService(itemRepo as any, plRepo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all items", async () => {
      itemRepo.findAll = mock(() => Promise.resolve([itemNmaxKey]));
      expect(await service.getAll()).toEqual([itemNmaxKey]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns item when found", async () => {
      itemRepo.findById = mock(() => Promise.resolve(itemNmaxKey));
      expect(await service.getById(1)).toEqual(itemNmaxKey);
    });

    it("throws when not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByPackingList ───────────────────────────────────────────────────────

  describe("getByPackingList", () => {
    it("returns items ordered by sortOrder", async () => {
      itemRepo.findByPackingList = mock(() =>
        Promise.resolve([itemNmaxKey, itemNmaxKeyless])
      );
      const result = await service.getByPackingList(1);
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe("YAMAHA NMAX NEO (KEY)");
      expect(itemRepo.findByPackingList).toHaveBeenCalledWith(1);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    const createInput = {
      packingListId: 1,
      description: "YAMAHA NMAX NEO (KEY)",
      quantity: 20,
      grossWeight: "2660.00",
      netWeight: "2740.00",
    } as any;

    it("throws when packing list does not exist", async () => {
      expect(service.create(createInput)).rejects.toThrow("not found");
    });

    it("creates item and calls recalculate on parent", async () => {
      plRepo.findById = mock(() => Promise.resolve(mockPL));
      itemRepo.create = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.findByPackingList = mock(() => Promise.resolve([itemNmaxKey]));
      plRepo.update = mock(() => Promise.resolve(mockPL));

      await service.create(createInput);

      expect(itemRepo.create).toHaveBeenCalledTimes(1);
      expect(plRepo.update).toHaveBeenCalledTimes(1);
    });

    it("recalculates totals correctly with a single item", async () => {
      plRepo.findById = mock(() => Promise.resolve(mockPL));
      itemRepo.create = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.findByPackingList = mock(() => Promise.resolve([itemNmaxKey]));
      let totals: any;
      plRepo.update = mock((_, data: any) => {
        totals = data;
        return Promise.resolve(mockPL);
      });

      await service.create(createInput);

      expect(totals.totalQuantity).toBe(20);
      expect(totals.totalGrossWeight).toBe("2660.00");
      expect(totals.totalNetWeight).toBe("2740.00");
    });

    it("recalculates totals correctly with multiple items (real invoice data)", async () => {
      plRepo.findById = mock(() => Promise.resolve(mockPL));
      itemRepo.create = mock(() => Promise.resolve(itemNmaxKeyless));
      // After adding second item, both items exist
      itemRepo.findByPackingList = mock(() =>
        Promise.resolve([itemNmaxKey, itemNmaxKeyless])
      );
      let totals: any;
      plRepo.update = mock((_, data: any) => {
        totals = data;
        return Promise.resolve(mockPL);
      });

      await service.create({
        packingListId: 1,
        description: "YAMAHA NMAX NEO (KEYLESS)",
        quantity: 21,
        grossWeight: "2793.00",
        netWeight: "2877.00",
      } as any);

      // 20 + 21 = 41
      expect(totals.totalQuantity).toBe(41);
      // 2660 + 2793 = 5453
      expect(totals.totalGrossWeight).toBe("5453.00");
      // 2740 + 2877 = 5617
      expect(totals.totalNetWeight).toBe("5617.00");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when item does not exist", async () => {
      expect(service.update(99, {})).rejects.toThrow("not found");
    });

    it("updates item and recalculates totals", async () => {
      const updatedItem = { ...itemNmaxKey, quantity: 25 };
      itemRepo.findById = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.update = mock(() => Promise.resolve(updatedItem));
      itemRepo.findByPackingList = mock(() => Promise.resolve([updatedItem]));
      let totals: any;
      plRepo.update = mock((_, data: any) => {
        totals = data;
        return Promise.resolve(mockPL);
      });

      const result = await service.update(1, { quantity: 25 });

      expect(result.quantity).toBe(25);
      expect(totals.totalQuantity).toBe(25);
      expect(plRepo.update).toHaveBeenCalledTimes(1);
    });

    it("recalculates totals based on remaining items after update", async () => {
      const updatedItem = { ...itemNmaxKey, grossWeight: "3000.00", netWeight: "3100.00" };
      itemRepo.findById = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.update = mock(() => Promise.resolve(updatedItem));
      // Both items exist, but first one has updated weights
      itemRepo.findByPackingList = mock(() =>
        Promise.resolve([updatedItem, itemNmaxKeyless])
      );
      let totals: any;
      plRepo.update = mock((_, data: any) => {
        totals = data;
        return Promise.resolve(mockPL);
      });

      await service.update(1, { grossWeight: "3000.00", netWeight: "3100.00" });

      // 3000 + 2793 = 5793
      expect(totals.totalGrossWeight).toBe("5793.00");
      // 3100 + 2877 = 5977
      expect(totals.totalNetWeight).toBe("5977.00");
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when item does not exist", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes item and recalculates totals with remaining items", async () => {
      itemRepo.findById = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.delete = mock(() => Promise.resolve(itemNmaxKey));
      // After deleting itemNmaxKey, only itemNmaxKeyless remains
      itemRepo.findByPackingList = mock(() => Promise.resolve([itemNmaxKeyless]));
      let totals: any;
      plRepo.update = mock((_, data: any) => {
        totals = data;
        return Promise.resolve(mockPL);
      });

      const result = await service.delete(1);

      expect(result).toEqual(itemNmaxKey);
      expect(totals.totalQuantity).toBe(21);
      expect(totals.totalGrossWeight).toBe("2793.00");
      expect(totals.totalNetWeight).toBe("2877.00");
    });

    it("sets totals to zero when the last item is deleted", async () => {
      itemRepo.findById = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.delete = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.findByPackingList = mock(() => Promise.resolve([])); // nothing left
      let totals: any;
      plRepo.update = mock((_, data: any) => {
        totals = data;
        return Promise.resolve(mockPL);
      });

      await service.delete(1);

      expect(totals.totalQuantity).toBe(0);
      expect(totals.totalGrossWeight).toBe("0.00");
      expect(totals.totalNetWeight).toBe("0.00");
    });

    it("calls plRepo.update with the packingListId of the deleted item", async () => {
      itemRepo.findById = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.delete = mock(() => Promise.resolve(itemNmaxKey));
      itemRepo.findByPackingList = mock(() => Promise.resolve([]));
      plRepo.update = mock(() => Promise.resolve(mockPL));

      await service.delete(1);

      // Should update packing list id=1 (from itemNmaxKey.packingListId)
      expect(plRepo.update.mock.calls[0][0]).toBe(1);
    });
  });
});
