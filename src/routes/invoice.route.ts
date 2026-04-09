import { Elysia, t } from "elysia";
import { db } from "../db";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { ExportOrderRepository } from "../repositories/export-order.repository";
import { InvoiceService } from "../services/invoice.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const invoiceService = new InvoiceService(
  new InvoiceRepository(db),
  new ExportOrderRepository(db),
);

const invoiceStatusValues = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
] as const;

export const invoiceRoutes = new Elysia({
  prefix: "/invoices",
  detail: { tags: ["Invoices"] },
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
      message.toLowerCase().includes("cannot be") ||
      message.toLowerCase().includes("only draft") ||
      message.toLowerCase().includes("cannot record")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /invoices ────────────────────────────────────────────────────────
  .get("/", async () => {
    const data = await invoiceService.getAll();
    return { success: true, data };
  })
  // ─── GET /invoices/status/:status ─────────────────────────────────────────
  .get(
    "/status/:status",
    async ({ params }) => {
      const data = await invoiceService.getByStatus(params.status);
      return { success: true, data };
    },
    {
      params: t.Object({
        status: t.Union(invoiceStatusValues.map((s) => t.Literal(s))),
      }),
    },
  )
  // ─── GET /invoices/export-order/:exportOrderId ────────────────────────────
  .get(
    "/export-order/:exportOrderId",
    async ({ params }) => {
      const data = await invoiceService.getByExportOrder(params.exportOrderId);
      return { success: true, data };
    },
    { params: t.Object({ exportOrderId: t.Numeric() }) },
  )
  // ─── GET /invoices/client/:clientId ──────────────────────────────────────
  .get(
    "/client/:clientId",
    async ({ params }) => {
      const data = await invoiceService.getByClient(params.clientId);
      return { success: true, data };
    },
    { params: t.Object({ clientId: t.Numeric() }) },
  )
  // ─── GET /invoices/:id ────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await invoiceService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  // ─── POST /invoices ───────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const { dueDate, etd, ...rest } = body;
      const data = await invoiceService.create({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        etd: etd ? new Date(etd) : undefined,
      });
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        invoiceNumber: t.String(),
        exportOrderId: t.Number(),
        clientId: t.Number(),
        vessel: t.Optional(t.String()),
        etd: t.Optional(t.String()),
        fromPort: t.Optional(t.String()),
        toPort: t.Optional(t.String()),
        shippingTerm: t.Optional(t.String()),
        countryOfOrigin: t.Optional(t.String()),
        subtotal: t.String(),
        freightAmount: t.Optional(t.String()),
        taxAmount: t.Optional(t.String()),
        totalAmount: t.String(),
        dueDate: t.Optional(t.String()),
        createdById: t.Optional(t.Number()),
      }),
    },
  )
  // ─── PATCH /invoices/:id/send ─────────────────────────────────────────────
  // draft → sent; sets issuedAt to now
  .patch(
    "/:id/send",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await invoiceService.send(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  // ─── PATCH /invoices/:id/paid ─────────────────────────────────────────────
  // sent/overdue → paid
  .patch(
    "/:id/paid",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export", "finance"], currentUser.role);
      const data = await invoiceService.markPaid(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  // ─── PATCH /invoices/:id/overdue ──────────────────────────────────────────
  // sent → overdue
  .patch(
    "/:id/overdue",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export", "finance"], currentUser.role);
      const data = await invoiceService.markOverdue(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  // ─── PATCH /invoices/:id/cancel ───────────────────────────────────────────
  // draft/sent/overdue → cancelled
  .patch(
    "/:id/cancel",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await invoiceService.cancel(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  // ─── PUT /invoices/:id ────────────────────────────────────────────────────
  // Only draft invoices can be updated
  .put(
    "/:id",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const { dueDate, etd, ...rest } = body;
      const data = await invoiceService.update(params.id, {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        etd: etd ? new Date(etd) : undefined,
      });
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        invoiceNumber: t.Optional(t.String()),
        vessel: t.Optional(t.String()),
        etd: t.Optional(t.String()),
        fromPort: t.Optional(t.String()),
        toPort: t.Optional(t.String()),
        shippingTerm: t.Optional(t.String()),
        countryOfOrigin: t.Optional(t.String()),
        subtotal: t.Optional(t.String()),
        freightAmount: t.Optional(t.String()),
        taxAmount: t.Optional(t.String()),
        totalAmount: t.Optional(t.String()),
        dueDate: t.Optional(t.String()),
      }),
    },
  )
  // ─── DELETE /invoices/:id ─────────────────────────────────────────────────
  // Only draft invoices can be deleted
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin", "admin_export"], currentUser.role);
      const data = await invoiceService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) },
  );
