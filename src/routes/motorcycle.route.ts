import { Elysia, t } from "elysia";
import { db } from "../db";
import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { WarehouseEntryRepository } from "../repositories/warehouse-entry.repository";
import { MotorcycleService } from "../services/motorcycle.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const motorcycleService = new MotorcycleService(
  new MotorcycleRepository(db),
  new WarehouseEntryRepository(db),
);

export const motorcycleRoutes = new Elysia({
  prefix: "/motorcycles",
  detail: { tags: ["Motorcycles"] },
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
      message.toLowerCase().includes("already registered") ||
      message.toLowerCase().includes("already completed") ||
      message.toLowerCase().includes("cannot transition") ||
      message.toLowerCase().includes("only on-site")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /motorcycles ─────────────────────────────────────────────────────
  .get(
    "/",
    async ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const result = await motorcycleService.getPaginated(
        {
          status: query.status,
          branchId: query.branchId,
          typeId: query.typeId,
          color: query.color,
          search: query.search,
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
          t.Union([
            t.Literal("on_site"),
            t.Literal("loading"),
            t.Literal("exported"),
            t.Literal("transferred"),
          ])
        ),
        branchId: t.Optional(t.String()),
        typeId: t.Optional(t.String()),
        color: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    },
  )
  // ─── GET /motorcycles/status/:status ──────────────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await motorcycleService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({
        status: t.Union([
          t.Literal("on_site"),
          t.Literal("loading"),
          t.Literal("exported"),
          t.Literal("transferred"),
        ]),
      }),
    },
  )
  // ─── GET /motorcycles/branch/:branchId ────────────────────────────────────
  .get(
    "/branch/:branchId",
    async ({ params }) => {
      const data = await motorcycleService.getByBranch(params.branchId);
      return { success: true, data };
    },
    {
      params: t.Object({ branchId: t.String() }),
    },
  )
  // ─── GET /motorcycles/entry/:entryId ──────────────────────────────────────
  .get(
    "/entry/:entryId",
    async ({ params }) => {
      const data = await motorcycleService.getByEntry(params.entryId);
      return { success: true, data };
    },
    {
      params: t.Object({ entryId: t.String() }),
    },
  )
  // ─── GET /motorcycles/type/:typeId ────────────────────────────────────────
  .get(
    "/type/:typeId",
    async ({ params }) => {
      const data = await motorcycleService.getByType(params.typeId);
      return { success: true, data };
    },
    {
      params: t.Object({ typeId: t.String() }),
    },
  )
  // ─── GET /motorcycles/frame/:frameNumber ──────────────────────────────────
  .get(
    "/frame/:frameNumber",
    async ({ params }) => {
      const data = await motorcycleService.getByFrameNumber(params.frameNumber);
      return { success: true, data };
    },
    {
      params: t.Object({ frameNumber: t.String() }),
    },
  )
  // ─── GET /motorcycles/engine/:engineNumber ────────────────────────────────
  .get(
    "/engine/:engineNumber",
    async ({ params }) => {
      const data = await motorcycleService.getByEngineNumber(
        params.engineNumber,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ engineNumber: t.String() }),
    },
  )
  // ─── GET /motorcycles/barcode/:barcode ────────────────────────────────────
  .get(
    "/barcode/:barcode",
    async ({ params }) => {
      const data = await motorcycleService.getByBarcode(params.barcode);
      return { success: true, data };
    },
    {
      params: t.Object({ barcode: t.String() }),
    },
  )
  // ─── GET /motorcycles/:id ─────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await motorcycleService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // ─── POST /motorcycles/scan ───────────────────────────────────────────────
  // Core warehouse entry action (Steps 3–6 in the mobile wizard).
  // Validates frame/engine uniqueness, auto-generates noInduk & barcode,
  // and increments the parent warehouse entry scan count.
  .post(
    "/scan",
    async ({ body, set, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await motorcycleService.scan({
        ...body,
        entryDate: new Date(),
        frontPhotoUrl: body.frontPhotoUrl ?? null,
        framePhotoUrl: body.framePhotoUrl ?? null,
        enginePhotoUrl: body.enginePhotoUrl ?? null,
        notes: body.notes ?? null,
        entryId: body.entryId ?? null,
      });
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        typeId: t.String(),
        color: t.String({ minLength: 1 }),
        frameNumber: t.String({ minLength: 1 }),
        engineNumber: t.String({ minLength: 1 }),
        branchId: t.String(),
        entryId: t.Optional(t.String()),
        frontPhotoUrl: t.Optional(t.String()),
        framePhotoUrl: t.Optional(t.String()),
        enginePhotoUrl: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  // ─── PATCH /motorcycles/:id/status ────────────────────────────────────────
  // Transition: on_site → loading/transferred, loading → on_site/exported
  .patch(
    "/:id/status",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await motorcycleService.updateStatus(params.id, body.status);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        status: t.Union([
          t.Literal("on_site"),
          t.Literal("loading"),
          t.Literal("exported"),
          t.Literal("transferred"),
        ]),
      }),
    },
  )
  // ─── PUT /motorcycles/:id ─────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await motorcycleService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        typeId: t.Optional(t.String()),
        color: t.Optional(t.String({ minLength: 1 })),
        frameNumber: t.Optional(t.String({ minLength: 1 })),
        engineNumber: t.Optional(t.String({ minLength: 1 })),
        branchId: t.Optional(t.String()),
        frontPhotoUrl: t.Optional(t.String()),
        framePhotoUrl: t.Optional(t.String()),
        enginePhotoUrl: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  // ─── DELETE /motorcycles/:id ──────────────────────────────────────────────
  // Only on_site motorcycles can be deleted.
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse"], currentUser.role);
      const data = await motorcycleService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  );
