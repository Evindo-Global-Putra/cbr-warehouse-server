import { Elysia, t } from "elysia";
import { db } from "../db";
import { WarehouseTransferMotorcycleRepository } from "../repositories/warehouse-transfer-motorcycle.repository";
import { WarehouseTransferRepository } from "../repositories/warehouse-transfer.repository";
import { MotorcycleRepository } from "../repositories/motorcycle.repository";
import { WarehouseTransferMotorcycleService } from "../services/warehouse-transfer-motorcycle.service";

const wtmService = new WarehouseTransferMotorcycleService(
  new WarehouseTransferMotorcycleRepository(db),
  new WarehouseTransferRepository(db),
  new MotorcycleRepository(db)
);

export const warehouseTransferMotorcycleRoutes = new Elysia({
  prefix: "/warehouse-transfer-motorcycles",
})
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot add") ||
      message.toLowerCase().includes("cannot remove") ||
      message.toLowerCase().includes("not available") ||
      message.toLowerCase().includes("not at the source") ||
      message.toLowerCase().includes("not pending")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /warehouse-transfer-motorcycles/transfer/:transferId ────────────
  .get(
    "/transfer/:transferId",
    async ({ params }) => {
      const data = await wtmService.getByTransfer(params.transferId);
      return { success: true, data };
    },
    { params: t.Object({ transferId: t.Numeric() }) }
  )
  // ─── GET /warehouse-transfer-motorcycles/motorcycle/:motorcycleId ─────────
  .get(
    "/motorcycle/:motorcycleId",
    async ({ params }) => {
      const data = await wtmService.getByMotorcycle(params.motorcycleId);
      return { success: true, data };
    },
    { params: t.Object({ motorcycleId: t.Numeric() }) }
  )
  // ─── GET /warehouse-transfer-motorcycles/:id ──────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await wtmService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /warehouse-transfer-motorcycles ─────────────────────────────────
  // Add a motorcycle to a pending transfer
  .post(
    "/",
    async ({ body, set }) => {
      const data = await wtmService.addMotorcycle(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        transferId: t.Number(),
        motorcycleId: t.Number(),
      }),
    }
  )
  // ─── DELETE /warehouse-transfer-motorcycles/transfer/:transferId/motorcycle/:motorcycleId
  // Remove a specific motorcycle from a pending transfer
  .delete(
    "/transfer/:transferId/motorcycle/:motorcycleId",
    async ({ params }) => {
      const data = await wtmService.removeMotorcycle(
        params.transferId,
        params.motorcycleId
      );
      return { success: true, data };
    },
    {
      params: t.Object({
        transferId: t.Numeric(),
        motorcycleId: t.Numeric(),
      }),
    }
  )
  // ─── DELETE /warehouse-transfer-motorcycles/:id ───────────────────────────
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await wtmService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
