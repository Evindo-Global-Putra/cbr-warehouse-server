import { Elysia, t } from "elysia";
import { db } from "../db";
import { InvoiceItemRepository } from "../repositories/invoice-item.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { InvoiceItemService } from "../services/invoice-item.service";

const invoiceItemService = new InvoiceItemService(
  new InvoiceItemRepository(db),
  new InvoiceRepository(db)
);

export const invoiceItemRoutes = new Elysia({ prefix: "/invoice-items" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot add items") ||
      message.toLowerCase().includes("cannot modify") ||
      message.toLowerCase().includes("cannot delete")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /invoice-items ───────────────────────────────────────────────────
  .get("/", async () => {
    const data = await invoiceItemService.getAll();
    return { success: true, data };
  })
  // ─── GET /invoice-items/invoice/:invoiceId ────────────────────────────────
  // Returns items ordered by sortOrder (matches printed invoice line order)
  .get(
    "/invoice/:invoiceId",
    async ({ params }) => {
      const data = await invoiceItemService.getByInvoice(params.invoiceId);
      return { success: true, data };
    },
    { params: t.Object({ invoiceId: t.Numeric() }) }
  )
  // ─── GET /invoice-items/:id ───────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await invoiceItemService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /invoice-items ──────────────────────────────────────────────────
  // amount is auto-computed (quantity × unitPrice); only allowed on draft invoices.
  .post(
    "/",
    async ({ body, set }) => {
      const data = await invoiceItemService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        invoiceId: t.Number(),
        description: t.String({ minLength: 1 }),
        motorcycleTypeId: t.Optional(t.Number()),
        accessoryId: t.Optional(t.Number()),
        quantity: t.Number({ minimum: 1 }),
        unitPrice: t.String(), // USD as numeric string, e.g. "1700.00"
        sortOrder: t.Optional(t.Number()),
      }),
    }
  )
  // ─── PUT /invoice-items/:id ───────────────────────────────────────────────
  // amount is auto-recomputed when quantity or unitPrice changes.
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await invoiceItemService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        description: t.Optional(t.String({ minLength: 1 })),
        motorcycleTypeId: t.Optional(t.Nullable(t.Number())),
        accessoryId: t.Optional(t.Nullable(t.Number())),
        quantity: t.Optional(t.Number({ minimum: 1 })),
        unitPrice: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
      }),
    }
  )
  // ─── DELETE /invoice-items/:id ────────────────────────────────────────────
  // Only allowed when the parent invoice is still in draft.
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await invoiceItemService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
