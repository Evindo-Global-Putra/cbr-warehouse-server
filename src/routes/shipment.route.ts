import { Elysia, t } from "elysia";
import { db } from "../db";
import { ShipmentRepository } from "../repositories/shipment.repository";
import { LoadingFormRepository } from "../repositories/loading-form.repository";
import { ShipmentService } from "../services/shipment.service";

const shipmentService = new ShipmentService(
  new ShipmentRepository(db),
  new LoadingFormRepository(db)
);

const shipmentStatusValues = [
  "pending",
  "in_transit",
  "arrived",
  "delivered",
] as const;

export const shipmentRoutes = new Elysia({ prefix: "/shipments" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot be marked") ||
      message.toLowerCase().includes("only pending") ||
      message.toLowerCase().includes("not validated")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /shipments ───────────────────────────────────────────────────────
  .get("/", async () => {
    const data = await shipmentService.getAll();
    return { success: true, data };
  })
  // ─── GET /shipments/status/:status ────────────────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await shipmentService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({
        status: t.Union(shipmentStatusValues.map((s) => t.Literal(s))),
      }),
    }
  )
  // ─── GET /shipments/loading-form/:loadingFormId ───────────────────────────
  .get(
    "/loading-form/:loadingFormId",
    async ({ params }) => {
      const data = await shipmentService.getByLoadingForm(params.loadingFormId);
      return { success: true, data };
    },
    { params: t.Object({ loadingFormId: t.Numeric() }) }
  )
  // ─── GET /shipments/:id ───────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await shipmentService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /shipments ──────────────────────────────────────────────────────
  // Only creatable from a validated loading form
  .post(
    "/",
    async ({ body, set }) => {
      const data = await shipmentService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        loadingFormId: t.Number(),
        trackingNumber: t.Optional(t.String()),
        carrier: t.Optional(t.String()),
        destinationCountry: t.Optional(t.String()),
        estimatedArrival: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )
  // ─── PATCH /shipments/:id/in-transit ──────────────────────────────────────
  // pending → in_transit; sets shippedAt to now
  .patch(
    "/:id/in-transit",
    async ({ params }) => {
      const data = await shipmentService.markInTransit(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── PATCH /shipments/:id/arrived ────────────────────────────────────────
  // in_transit → arrived; sets actualArrival to now
  .patch(
    "/:id/arrived",
    async ({ params }) => {
      const data = await shipmentService.markArrived(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── PATCH /shipments/:id/delivered ──────────────────────────────────────
  // arrived → delivered
  .patch(
    "/:id/delivered",
    async ({ params }) => {
      const data = await shipmentService.markDelivered(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── PUT /shipments/:id ───────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await shipmentService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        trackingNumber: t.Optional(t.String()),
        carrier: t.Optional(t.String()),
        destinationCountry: t.Optional(t.String()),
        estimatedArrival: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )
  // ─── DELETE /shipments/:id ────────────────────────────────────────────────
  // Only pending shipments can be deleted
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await shipmentService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
