import { Elysia, t } from "elysia";
import { db } from "../db";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { ExportOrderService } from "../services/export-order.service";

const exportOrderService = new ExportOrderService(new ExportOrderRepository(db));

const exportOrderStatusValues = [
  "pending",
  "confirmed",
  "in_progress",
  "loading",
  "shipped",
  "completed",
  "cancelled",
] as const;

export const exportOrderRoutes = new Elysia({ prefix: "/export-orders" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("already exists") ||
      message.toLowerCase().includes("cannot transition") ||
      message.toLowerCase().includes("only pending")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /export-orders ───────────────────────────────────────────────────
  .get("/", async () => {
    const data = await exportOrderService.getAll();
    return { success: true, data };
  })
  // ─── GET /export-orders/status/:status ───────────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await exportOrderService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({
        status: t.Union(exportOrderStatusValues.map((s) => t.Literal(s))),
      }),
    }
  )
  // ─── GET /export-orders/client/:clientId ──────────────────────────────────
  .get(
    "/client/:clientId",
    async ({ params }) => {
      const data = await exportOrderService.getByClient(params.clientId);
      return { success: true, data };
    },
    { params: t.Object({ clientId: t.Numeric() }) }
  )
  // ─── GET /export-orders/branch/:branchId ─────────────────────────────────
  .get(
    "/branch/:branchId",
    async ({ params }) => {
      const data = await exportOrderService.getByBranch(params.branchId);
      return { success: true, data };
    },
    { params: t.Object({ branchId: t.Numeric() }) }
  )
  // ─── GET /export-orders/:id ───────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await exportOrderService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /export-orders ──────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const data = await exportOrderService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        orderNumber: t.String(),
        clientId: t.Number(),
        branchId: t.Number(),
        requestedUnits: t.Number({ minimum: 1 }),
        notes: t.Optional(t.String()),
        createdById: t.Optional(t.Number()),
      }),
    }
  )
  // ─── PATCH /export-orders/:id/status ─────────────────────────────────────
  .patch(
    "/:id/status",
    async ({ params, body }) => {
      const data = await exportOrderService.updateStatus(params.id, body.status);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        status: t.Union(exportOrderStatusValues.map((s) => t.Literal(s))),
      }),
    }
  )
  // ─── PUT /export-orders/:id ───────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await exportOrderService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        orderNumber: t.Optional(t.String()),
        clientId: t.Optional(t.Number()),
        branchId: t.Optional(t.Number()),
        requestedUnits: t.Optional(t.Number({ minimum: 1 })),
        notes: t.Optional(t.String()),
        createdById: t.Optional(t.Number()),
      }),
    }
  )
  // ─── DELETE /export-orders/:id ────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await exportOrderService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
