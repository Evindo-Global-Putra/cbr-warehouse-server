import { Elysia, t } from "elysia";
import { db } from "../db";
import { WarehouseTransferRepository } from "../repositories/warehouse-transfer.repository";
import { WarehouseTransferMotorcycleRepository } from "../repositories/warehouse-transfer-motorcycle.repository";
import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { WarehouseTransferService } from "../services/warehouse-transfer.service";

const transferService = new WarehouseTransferService(
  new WarehouseTransferRepository(db),
  new WarehouseTransferMotorcycleRepository(db),
  new MotorcycleRepository(db)
);

const transferStatusValues = [
  "pending",
  "in_transit",
  "completed",
  "cancelled",
] as const;

export const warehouseTransferRoutes = new Elysia({ prefix: "/warehouse-transfers" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot be marked") ||
      message.toLowerCase().includes("cannot be cancelled") ||
      message.toLowerCase().includes("only pending") ||
      message.toLowerCase().includes("cannot be completed") ||
      message.toLowerCase().includes("same")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /warehouse-transfers ─────────────────────────────────────────────
  .get("/", async () => {
    const data = await transferService.getAll();
    return { success: true, data };
  })
  // ─── GET /warehouse-transfers/status/:status ──────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await transferService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({
        status: t.Union(transferStatusValues.map((s) => t.Literal(s))),
      }),
    }
  )
  // ─── GET /warehouse-transfers/from-branch/:branchId ──────────────────────
  .get(
    "/from-branch/:branchId",
    async ({ params }) => {
      const data = await transferService.getByFromBranch(params.branchId);
      return { success: true, data };
    },
    { params: t.Object({ branchId: t.Numeric() }) }
  )
  // ─── GET /warehouse-transfers/to-branch/:branchId ────────────────────────
  .get(
    "/to-branch/:branchId",
    async ({ params }) => {
      const data = await transferService.getByToBranch(params.branchId);
      return { success: true, data };
    },
    { params: t.Object({ branchId: t.Numeric() }) }
  )
  // ─── GET /warehouse-transfers/:id ────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await transferService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /warehouse-transfers ────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const data = await transferService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        fromBranchId: t.Number(),
        toBranchId: t.Number(),
        notes: t.Optional(t.String()),
        createdById: t.Optional(t.Number()),
      }),
    }
  )
  // ─── PATCH /warehouse-transfers/:id/in-transit ────────────────────────────
  // pending → in_transit; marks all motorcycles as "transferred"
  .patch(
    "/:id/in-transit",
    async ({ params }) => {
      const data = await transferService.markInTransit(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── PATCH /warehouse-transfers/:id/complete ──────────────────────────────
  // in_transit → completed; moves motorcycles to destination branch
  .patch(
    "/:id/complete",
    async ({ params }) => {
      const data = await transferService.complete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── PATCH /warehouse-transfers/:id/cancel ────────────────────────────────
  // pending/in_transit → cancelled
  .patch(
    "/:id/cancel",
    async ({ params }) => {
      const data = await transferService.cancel(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── DELETE /warehouse-transfers/:id ─────────────────────────────────────
  // Only pending transfers can be deleted
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await transferService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
