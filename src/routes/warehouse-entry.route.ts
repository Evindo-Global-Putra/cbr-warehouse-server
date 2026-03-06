import { Elysia, t } from "elysia";
// import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { WarehouseEntryRepository } from "../repositories/warehouse-entry.repository";
import { WarehouseEntryService } from "../services/warehouse-entry.service";

const warehouseEntryService = new WarehouseEntryService(
  new WarehouseEntryRepository(db)
);

export const warehouseEntryRoutes = new Elysia({ prefix: "/warehouse-entries" })
  // .use(
  //   jwt({
  //     name: "jwt",
  //     secret: process.env.JWT_SECRET!,
  //   })
  // )
  // ─── Auth guard ───────────────────────────────────────────────────────────
  // .derive(async ({ headers, jwt }) => {
  //   const auth = headers["authorization"];
  //   if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");
  //
  //   const payload = await jwt.verify(auth.slice(7));
  //   if (!payload) throw new Error("Unauthorized");
  //
  //   return { currentUser: payload };
  // })
  // ─── Error handler ────────────────────────────────────────────────────────
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Unauthorized") {
      set.status = 401;
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
  .get("/", async () => {
    const data = await warehouseEntryService.getAll();
    return { success: true, data };
  })
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
    }
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
    }
  )
  // ─── GET /warehouse-entries/travel-permit/:travelPermitId ─────────────────
  .get(
    "/travel-permit/:travelPermitId",
    async ({ params }) => {
      const data = await warehouseEntryService.getByTravelPermit(
        params.travelPermitId
      );
      return { success: true, data };
    },
    {
      params: t.Object({ travelPermitId: t.Numeric() }),
    }
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
    }
  )
  // ─── POST /warehouse-entries ──────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
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
    }
  )
  // ─── PATCH /warehouse-entries/:id/scan ────────────────────────────────────
  // Called after each motorcycle unit is successfully scanned.
  // Auto-completes the session when totalUnitsScanned >= totalUnitsExpected.
  .patch(
    "/:id/scan",
    async ({ params }) => {
      const data = await warehouseEntryService.incrementScanned(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  // ─── PATCH /warehouse-entries/:id/complete ────────────────────────────────
  // Manually mark the session as completed.
  .patch(
    "/:id/complete",
    async ({ params }) => {
      const data = await warehouseEntryService.complete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  // ─── PUT /warehouse-entries/:id ───────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
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
    }
  )
  // ─── DELETE /warehouse-entries/:id ────────────────────────────────────────
  // Blocked if completed or any units already scanned.
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await warehouseEntryService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  );
