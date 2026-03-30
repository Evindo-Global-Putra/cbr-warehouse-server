import { Elysia, t } from "elysia";
import { db } from "../db";
import { AccessoryRepository } from "../repositories/accessory.repository";
import { AccessoryService } from "../services/accessory.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const accessoryService = new AccessoryService(new AccessoryRepository(db));

export const accessoryRoutes = new Elysia({ prefix: "/accessories" })
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
      message.toLowerCase().includes("insufficient stock")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /accessories ─────────────────────────────────────────────────────
  .get(
    "/",
    async ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const result = await accessoryService.getPaginated(
        { branchId: query.branchId, category: query.category, search: query.search },
        page,
        limit
      );
      return { success: true, ...result };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        branchId: t.Optional(t.Numeric()),
        category: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    },
  )
  // ─── GET /accessories/branch/:branchId ────────────────────────────────────
  .get(
    "/branch/:branchId",
    async ({ params }) => {
      const data = await accessoryService.getByBranch(params.branchId);
      return { success: true, data };
    },
    { params: t.Object({ branchId: t.Numeric() }) },
  )
  // ─── GET /accessories/sku/:sku ────────────────────────────────────────────
  .get(
    "/sku/:sku",
    async ({ params }) => {
      const data = await accessoryService.getBySku(params.sku);
      return { success: true, data };
    },
    { params: t.Object({ sku: t.String() }) },
  )
  // ─── GET /accessories/:id ─────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await accessoryService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  // ─── POST /accessories ────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await accessoryService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        name: t.String(),
        sku: t.String(),
        category: t.Optional(t.String()),
        description: t.Optional(t.String()),
        quantityInStock: t.Optional(t.Number({ minimum: 0 })),
        unitCost: t.Optional(t.String()),
        unitPrice: t.Optional(t.String()),
        grossWeightPerUnit: t.Optional(t.String()),
        netWeightPerUnit: t.Optional(t.String()),
        branchId: t.Optional(t.Number()),
      }),
    },
  )
  // ─── PATCH /accessories/:id/stock ─────────────────────────────────────────
  // Adjust stock by delta (positive = add, negative = deduct)
  .patch(
    "/:id/stock",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await accessoryService.adjustStock(params.id, body.delta);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({ delta: t.Number() }),
    },
  )
  // ─── PUT /accessories/:id ─────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await accessoryService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String()),
        sku: t.Optional(t.String()),
        category: t.Optional(t.String()),
        description: t.Optional(t.String()),
        quantityInStock: t.Optional(t.Number({ minimum: 0 })),
        unitCost: t.Optional(t.String()),
        unitPrice: t.Optional(t.String()),
        grossWeightPerUnit: t.Optional(t.Nullable(t.String())),
        netWeightPerUnit: t.Optional(t.Nullable(t.String())),
        branchId: t.Optional(t.Number()),
      }),
    },
  )
  // ─── DELETE /accessories/:id ──────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await accessoryService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  );
