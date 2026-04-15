import { Elysia, t } from "elysia";
import { db } from "../db";
import { ExportOrderItemRepository } from "../repositories/export-order-item.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { ExportOrderItemService } from "../services/export-order-item.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const exportOrderItemService = new ExportOrderItemService(
  new ExportOrderItemRepository(db),
  new ExportOrderRepository(db),
);

export const exportOrderItemRoutes = new Elysia({
  prefix: "/export-order-items",
  detail: { tags: ["Export Orders"] },
})
  .use(authPlugin)
  // ─── Error handler ────────────────────────────────────────────────────────
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Unauthorized") {
      set.status = 401;
      return { success: false, message };
    }
    if (message === "Forbidden") {
      set.status = 403;
      return { success: false, message };
    }
    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot add items") ||
      message.toLowerCase().includes("must reference") ||
      message.toLowerCase().includes("cannot reference both")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /export-order-items ──────────────────────────────────────────────
  .get("/", async () => {
    const data = await exportOrderItemService.getAll();
    return { success: true, data };
  })
  // ─── GET /export-order-items/order/:exportOrderId ─────────────────────────
  .get(
    "/order/:exportOrderId",
    async ({ params }) => {
      const data = await exportOrderItemService.getByExportOrder(params.exportOrderId);
      return { success: true, data };
    },
    { params: t.Object({ exportOrderId: t.String() }) },
  )
  // ─── GET /export-order-items/:id ──────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await exportOrderItemService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // ─── POST /export-order-items ─────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await exportOrderItemService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        exportOrderId: t.String(),
        motorcycleTypeId: t.Optional(t.String()),
        accessoryId: t.Optional(t.String()),
        quantityRequested: t.Number({ minimum: 1 }),
        quantityAssigned: t.Optional(t.Number({ minimum: 0 })),
        unitPrice: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  // ─── PUT /export-order-items/:id ──────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await exportOrderItemService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        quantityRequested: t.Optional(t.Number({ minimum: 1 })),
        quantityAssigned: t.Optional(t.Number({ minimum: 0 })),
        unitPrice: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  // ─── DELETE /export-order-items/:id ───────────────────────────────────────
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await exportOrderItemService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.String() }) },
  );
