import { Elysia, t } from "elysia";
import { db } from "../db";
import { ExportOrderMotorcycleRepository } from "../repositories/export-order-motorcycle.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { ExportOrderMotorcycleService } from "../services/export-order-motorcycle.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const exportOrderMotorcycleService = new ExportOrderMotorcycleService(
  new ExportOrderMotorcycleRepository(db),
  new ExportOrderRepository(db),
  new MotorcycleRepository(db),
);

export const exportOrderMotorcycleRoutes = new Elysia({
  prefix: "/export-order-motorcycles",
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
      message.toLowerCase().includes("not available") ||
      message.toLowerCase().includes("already assigned") ||
      message.toLowerCase().includes("cannot assign")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /export-order-motorcycles ────────────────────────────────────────
  .get("/", async () => {
    const data = await exportOrderMotorcycleService.getAll();
    return { success: true, data };
  })
  // ─── GET /export-order-motorcycles/order/:exportOrderId ───────────────────
  .get(
    "/order/:exportOrderId",
    async ({ params }) => {
      const data = await exportOrderMotorcycleService.getByExportOrder(
        params.exportOrderId,
      );
      return { success: true, data };
    },
    { params: t.Object({ exportOrderId: t.String() }) },
  )
  // ─── GET /export-order-motorcycles/:id ────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await exportOrderMotorcycleService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.String() }) },
  )
  // ─── POST /export-order-motorcycles ───────────────────────────────────────
  // Assign a motorcycle (on_site) to an export order → status becomes 'loading'
  .post(
    "/",
    async ({ body, set, currentUser }) => {
      requireRole(["super_admin", "admin_export", "admin_warehouse"], currentUser.role);
      const data = await exportOrderMotorcycleService.assign(
        body.exportOrderId,
        body.motorcycleId,
      );
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        exportOrderId: t.String(),
        motorcycleId: t.String(),
      }),
    },
  )
  // ─── DELETE /export-order-motorcycles/:id ─────────────────────────────────
  // Unassign a motorcycle → reverts status back to 'on_site'
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export", "admin_warehouse"], currentUser.role);
      const data = await exportOrderMotorcycleService.unassign(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.String() }) },
  );
