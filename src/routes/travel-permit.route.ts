import { Elysia, t } from "elysia";
import { db } from "../db";
import { TravelPermitRepository } from "../repositories/travel-permit.repository";
import { TravelPermitItemRepository } from "../repositories/travel-permit-item.repository";
import { TravelPermitItemReportRepository } from "../repositories/travel-permit-item-report.repository";
import { TravelPermitService } from "../services/travel-permit.service";
import { TravelPermitItemService } from "../services/travel-permit-item.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const travelPermitRepo = new TravelPermitRepository(db);
const travelPermitItemRepo = new TravelPermitItemRepository(db);
const travelPermitItemReportRepo = new TravelPermitItemReportRepository(db);

const travelPermitService = new TravelPermitService(travelPermitRepo);
const travelPermitItemService = new TravelPermitItemService(
  travelPermitItemRepo,
  travelPermitItemReportRepo,
  travelPermitRepo,
);

const statusEnum = t.Union([
  t.Literal("pending"),
  t.Literal("received"),
  t.Literal("validated"),
  t.Literal("sent"),
  t.Literal("completed"),
]);

const itemStatusEnum = t.Union([
  t.Literal("checked"),
  t.Literal("reported"),
  t.Literal("done"),
  t.Literal("cancelled"),
]);

const reportReasonEnum = t.Union([
  t.Literal("damaged"),
  t.Literal("wrong_color_model"),
  t.Literal("mismatch"),
]);

export const travelPermitRoutes = new Elysia({
  prefix: "/travel-permits",
  detail: { tags: ["Travel Permits"] },
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
    if (message.toLowerCase().includes("already exists")) {
      set.status = 409;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot transition") ||
      message.toLowerCase().includes("only pending") ||
      message.toLowerCase().includes("only validated") ||
      message.toLowerCase().includes("cannot send to staff") ||
      message.toLowerCase().includes("cannot add") ||
      message.toLowerCase().includes("cannot update") ||
      message.toLowerCase().includes("only checked") ||
      message.toLowerCase().includes("quantity affected")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAVEL PERMITS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── GET /travel-permits ──────────────────────────────────────────────────
  .get("/", async () => {
    const data = await travelPermitService.getAll();
    return { success: true, data };
  })
  // ─── GET /travel-permits/status/:status ───────────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await travelPermitService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({ status: statusEnum }),
    },
  )
  // ─── GET /travel-permits/supplier/:supplierId ─────────────────────────────
  .get(
    "/supplier/:supplierId",
    async ({ params }) => {
      const data = await travelPermitService.getBySupplier(params.supplierId);
      return { success: true, data };
    },
    {
      params: t.Object({ supplierId: t.String() }),
    },
  )
  // ─── GET /travel-permits/branch/:branchId ────────────────────────────────
  .get(
    "/branch/:branchId",
    async ({ params }) => {
      const data = await travelPermitService.getByBranch(params.branchId);
      return { success: true, data };
    },
    {
      params: t.Object({ branchId: t.String() }),
    },
  )
  // ─── GET /travel-permits/permit/:permitNumber ─────────────────────────────
  .get(
    "/permit/:permitNumber",
    async ({ params }) => {
      const data = await travelPermitService.getByPermitNumber(
        params.permitNumber,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ permitNumber: t.String() }),
    },
  )
  // ─── GET /travel-permits/:id ──────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await travelPermitService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // ─── POST /travel-permits ─────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse", "admin_export"], currentUser.role);
      const data = await travelPermitService.create({
        ...body,
        issuedDate: body.issuedDate ? new Date(body.issuedDate) : null,
      });
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        permitNumber: t.String({ minLength: 1 }),
        supplierId: t.String(),
        branchId: t.String(),
        totalUnits: t.Number({ minimum: 1 }),
        truckPoliceNumber: t.Optional(t.String()),
        driverName: t.Optional(t.String()),
        issuedDate: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        createdById: t.Optional(t.String()),
      }),
    },
  )
  // ─── PATCH /travel-permits/:id/status ────────────────────────────────────
  // Advance the SJ lifecycle: pending → received → validated → sent → completed
  .patch(
    "/:id/status",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse", "admin_export"], currentUser.role);
      const data = await travelPermitService.updateStatus(params.id, body.status);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ status: statusEnum }),
    },
  )
  // ─── POST /travel-permits/:id/send-to-staff ───────────────────────────────
  // Locks the permit and sends it to warehouse staff for scanning.
  // Only allowed when status is "validated" and all items are done/cancelled.
  .post(
    "/:id/send-to-staff",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await travelPermitService.sendToStaff(
        params.id,
        currentUser.id,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // ─── PUT /travel-permits/:id ──────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse", "admin_export"], currentUser.role);
      const data = await travelPermitService.update(params.id, {
        ...body,
        issuedDate: body.issuedDate ? new Date(body.issuedDate) : undefined,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : undefined,
      });
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        permitNumber: t.Optional(t.String({ minLength: 1 })),
        supplierId: t.Optional(t.String()),
        branchId: t.Optional(t.String()),
        totalUnits: t.Optional(t.Number({ minimum: 1 })),
        truckPoliceNumber: t.Optional(t.String()),
        driverName: t.Optional(t.String()),
        issuedDate: t.Optional(t.String()),
        receivedDate: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  // ─── DELETE /travel-permits/:id ───────────────────────────────────────────
  // Only pending permits can be deleted
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_warehouse", "admin_export"], currentUser.role);
      const data = await travelPermitService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAVEL PERMIT ITEMS (nested under /:id/items)
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── GET /travel-permits/:id/items ───────────────────────────────────────
  .get(
    "/:id/items",
    async ({ params }) => {
      const data = await travelPermitItemService.getByPermitId(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // ─── POST /travel-permits/:id/items ──────────────────────────────────────
  .post(
    "/:id/items",
    async ({ params, body, set, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await travelPermitItemService.create(params.id, body);
      set.status = 201;
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        motorcycleTypeId: t.String(),
        color: t.String({ minLength: 1 }),
        frameNumber: t.String({ minLength: 1 }),
        engineNumber: t.String({ minLength: 1 }),
        quantity: t.Number({ minimum: 1 }),
        nospk: t.Optional(t.String()),
        destinationCode: t.Optional(t.String()),
        year: t.Optional(t.Number()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  // ─── PUT /travel-permits/:id/items/:itemId ────────────────────────────────
  .put(
    "/:id/items/:itemId",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await travelPermitItemService.update(
        params.id,
        params.itemId,
        body,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String(), itemId: t.String() }),
      body: t.Object({
        motorcycleTypeId: t.Optional(t.String()),
        color: t.Optional(t.String({ minLength: 1 })),
        quantity: t.Optional(t.Number({ minimum: 1 })),
        notes: t.Optional(t.String()),
      }),
    },
  )
  // ─── PUT /travel-permits/:id/items/:itemId/status ─────────────────────────
  .put(
    "/:id/items/:itemId/status",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await travelPermitItemService.updateStatus(
        params.id,
        params.itemId,
        body.status,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String(), itemId: t.String() }),
      body: t.Object({ status: itemStatusEnum }),
    },
  )
  // ─── DELETE /travel-permits/:id/items/:itemId ─────────────────────────────
  .delete(
    "/:id/items/:itemId",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await travelPermitItemService.delete(
        params.id,
        params.itemId,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String(), itemId: t.String() }),
    },
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAVEL PERMIT ITEM REPORTS (nested under /:id/items/:itemId/reports)
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── GET /travel-permits/:id/items/:itemId/reports ────────────────────────
  .get(
    "/:id/items/:itemId/reports",
    async ({ params }) => {
      const data = await travelPermitItemService.getReportsByItemId(
        params.id,
        params.itemId,
      );
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String(), itemId: t.String() }),
    },
  )
  // ─── POST /travel-permits/:id/items/:itemId/reports ───────────────────────
  .post(
    "/:id/items/:itemId/reports",
    async ({ params, body, set, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await travelPermitItemService.createReport(
        params.id,
        params.itemId,
        { ...body, createdById: currentUser.id },
      );
      set.status = 201;
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.String(), itemId: t.String() }),
      body: t.Object({
        reason: reportReasonEnum,
        quantityAffected: t.Number({ minimum: 1 }),
        description: t.Optional(t.String()),
      }),
    },
  );
