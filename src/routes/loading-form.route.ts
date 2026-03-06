import { Elysia, t } from "elysia";
import { db } from "../db";
import { LoadingFormRepository } from "../repositories/loading-form.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { LoadingFormService } from "../services/loading-form.service";

const loadingFormService = new LoadingFormService(
  new LoadingFormRepository(db),
  new ExportOrderRepository(db)
);

export const loadingFormRoutes = new Elysia({ prefix: "/loading-forms" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot be confirmed") ||
      message.toLowerCase().includes("cannot be validated") ||
      message.toLowerCase().includes("only draft") ||
      message.toLowerCase().includes("cannot create a loading form")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /loading-forms ───────────────────────────────────────────────────
  .get("/", async () => {
    const data = await loadingFormService.getAll();
    return { success: true, data };
  })
  // ─── GET /loading-forms/status/:status ───────────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await loadingFormService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({
        status: t.Union([
          t.Literal("draft"),
          t.Literal("confirmed"),
          t.Literal("validated"),
        ]),
      }),
    }
  )
  // ─── GET /loading-forms/branch/:branchId ─────────────────────────────────
  .get(
    "/branch/:branchId",
    async ({ params }) => {
      const data = await loadingFormService.getByBranch(params.branchId);
      return { success: true, data };
    },
    { params: t.Object({ branchId: t.Numeric() }) }
  )
  // ─── GET /loading-forms/order/:exportOrderId ──────────────────────────────
  .get(
    "/order/:exportOrderId",
    async ({ params }) => {
      const data = await loadingFormService.getByExportOrder(params.exportOrderId);
      return { success: true, data };
    },
    { params: t.Object({ exportOrderId: t.Numeric() }) }
  )
  // ─── GET /loading-forms/:id ───────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await loadingFormService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /loading-forms ──────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const data = await loadingFormService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        exportOrderId: t.Number(),
        branchId: t.Number(),
        truckPoliceNumber: t.Optional(t.String()),
        createdById: t.Optional(t.Number()),
      }),
    }
  )
  // ─── PATCH /loading-forms/:id/confirm ────────────────────────────────────
  // Advance status: draft → confirmed
  .patch(
    "/:id/confirm",
    async ({ params }) => {
      const data = await loadingFormService.confirm(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── PATCH /loading-forms/:id/validate ───────────────────────────────────
  // Advance status: confirmed → validated; also sets export order to 'loading'
  .patch(
    "/:id/validate",
    async ({ params, body }) => {
      const data = await loadingFormService.validate(params.id, body.validatedById);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({ validatedById: t.Number() }),
    }
  )
  // ─── PUT /loading-forms/:id ───────────────────────────────────────────────
  // Only editable while in draft status
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await loadingFormService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        exportOrderId: t.Optional(t.Number()),
        branchId: t.Optional(t.Number()),
        truckPoliceNumber: t.Optional(t.String()),
        createdById: t.Optional(t.Number()),
      }),
    }
  )
  // ─── DELETE /loading-forms/:id ────────────────────────────────────────────
  // Only draft loading forms can be deleted
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await loadingFormService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
