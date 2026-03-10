import { Elysia, t } from "elysia";
import { db } from "../db";
import { PackingListRepository } from "../repositories/packing-list.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PackingListService } from "../services/packing-list.service";

const packingListService = new PackingListService(
  new PackingListRepository(db),
  new InvoiceRepository(db)
);

export const packingListRoutes = new Elysia({ prefix: "/packing-lists" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (message.toLowerCase().includes("already exists")) {
      set.status = 409;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /packing-lists ───────────────────────────────────────────────────
  .get("/", async () => {
    const data = await packingListService.getAll();
    return { success: true, data };
  })
  // ─── GET /packing-lists/invoice/:invoiceId ────────────────────────────────
  // Packing list is 1:1 with invoice; returns the single packing list for it.
  .get(
    "/invoice/:invoiceId",
    async ({ params }) => {
      const data = await packingListService.getByInvoice(params.invoiceId);
      return { success: true, data };
    },
    { params: t.Object({ invoiceId: t.Numeric() }) }
  )
  // ─── GET /packing-lists/:id ───────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await packingListService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /packing-lists ──────────────────────────────────────────────────
  // Creates a packing list linked to an invoice (1:1). Fails if one already exists.
  // totalQuantity / totalGrossWeight / totalNetWeight are auto-updated when items change.
  .post(
    "/",
    async ({ body, set }) => {
      const data = await packingListService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        invoiceId: t.Number(),
        shippingTerm: t.Optional(t.String()),
        totalQuantity: t.Optional(t.Number({ minimum: 0 })),
        totalGrossWeight: t.Optional(t.String()), // kg as numeric string
        totalNetWeight: t.Optional(t.String()),   // kg as numeric string
      }),
    }
  )
  // ─── PUT /packing-lists/:id ───────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await packingListService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        shippingTerm: t.Optional(t.String()),
        totalQuantity: t.Optional(t.Number({ minimum: 0 })),
        totalGrossWeight: t.Optional(t.String()),
        totalNetWeight: t.Optional(t.String()),
      }),
    }
  )
  // ─── DELETE /packing-lists/:id ────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await packingListService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
