import { Elysia, t } from "elysia";
import { db } from "../db";
import { WarehouseEntryRepository } from "../repositories/warehouse-entry.repository";
import { WarehouseEntryService } from "../services/warehouse-entry.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const warehouseEntryService = new WarehouseEntryService(
  new WarehouseEntryRepository(db),
);

export const warehouseEntryRoutes = new Elysia({ prefix: "/warehouse-entries" })
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
      message.toLowerCase().includes("already exists") ||
      message.toLowerCase().includes("already completed") ||
      message.toLowerCase().includes("cannot delete") ||
      message.toLowerCase().includes("already scanned")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /warehouse-entries ───────────────────────────────────────────────
  .get(
    "/",
    async ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const result = await warehouseEntryService.getPaginated(
        {
          status: query.status,
          branchId: query.branchId,
          travelPermitId: query.travelPermitId,
        },
        page,
        limit
      );
      return { success: true, ...result };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        status: t.Optional(
          t.Union([t.Literal("in_progress"), t.Literal("completed")])
        ),
        branchId: t.Optional(t.Numeric()),
        travelPermitId: t.Optional(t.Numeric()),
      }),
    },
  )
  // ─── GET /warehouse-entries/status/:status ────────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await warehouseEntryService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({
        status: t.Union([t.Literal("in_progress"), t.Literal("completed")]),
      }),
    },
  )
  // ─── GET /warehouse-entries/branch/:branchId ──────────────────────────────
  .get(
    "/branch/:branchId",
    async ({ params }) => {
      const data = await warehouseEntryService.getByBranch(params.branchId);
      return { success: true, data };
    },
    {
      params: t.Object({ branchId: t.Numeric() }),
    },
  )
  // ─── GET /warehouse-entries/travel-permit/:travelPermitId ─────────────────
  .get(
    "/travel-permit/:travelPermitId",
    async ({ params }) => {
      const data = await warehouseEntryService.getByTravelPermit(
        params.travelPermitId,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ travelPermitId: t.Numeric() }),
    },
  )
  // ─── GET /warehouse-entries/:id ───────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await warehouseEntryService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  // ─── POST /warehouse-entries ──────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await warehouseEntryService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        travelPermitId: t.Number(),
        branchId: t.Number(),
        totalUnitsExpected: t.Number({ minimum: 1 }),
        createdById: t.Optional(t.Number()),
      }),
    },
  )
  // ─── PATCH /warehouse-entries/:id/scan ────────────────────────────────────
  // Called after each motorcycle unit is successfully scanned.
  // Auto-completes the session when totalUnitsScanned >= totalUnitsExpected.
  .patch(
    "/:id/scan",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await warehouseEntryService.incrementScanned(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  // ─── PATCH /warehouse-entries/:id/complete ────────────────────────────────
  // Manually mark the session as completed.
  .patch(
    "/:id/complete",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await warehouseEntryService.complete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  // ─── PUT /warehouse-entries/:id ───────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await warehouseEntryService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        travelPermitId: t.Optional(t.Number()),
        branchId: t.Optional(t.Number()),
        totalUnitsExpected: t.Optional(t.Number({ minimum: 1 })),
        createdById: t.Optional(t.Number()),
      }),
    },
  )
  // ─── DELETE /warehouse-entries/:id ────────────────────────────────────────
  // Blocked if completed or any units already scanned.
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await warehouseEntryService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  );
