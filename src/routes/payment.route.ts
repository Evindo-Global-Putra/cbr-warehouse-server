import { Elysia, t } from "elysia";
import { db } from "../db";
import { PaymentRepository } from "../repositories/payment.repository";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PaymentService } from "../services/payment.service";

const paymentService = new PaymentService(
  new PaymentRepository(db),
  new InvoiceRepository(db)
);

const paymentMethodValues = [
  "bank_transfer",
  "cash",
  "check",
  "other",
] as const;

export const paymentRoutes = new Elysia({ prefix: "/payments" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }
    if (
      message.toLowerCase().includes("cannot record") ||
      message.toLowerCase().includes("cannot delete")
    ) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /payments ────────────────────────────────────────────────────────
  .get("/", async () => {
    const data = await paymentService.getAll();
    return { success: true, data };
  })
  // ─── GET /payments/invoice/:invoiceId ─────────────────────────────────────
  .get(
    "/invoice/:invoiceId",
    async ({ params }) => {
      const data = await paymentService.getByInvoice(params.invoiceId);
      return { success: true, data };
    },
    { params: t.Object({ invoiceId: t.Numeric() }) }
  )
  // ─── GET /payments/method/:method ─────────────────────────────────────────
  .get(
    "/method/:method",
    async ({ params }) => {
      const data = await paymentService.getByMethod(params.method);
      return { success: true, data };
    },
    {
      params: t.Object({
        method: t.Union(paymentMethodValues.map((m) => t.Literal(m))),
      }),
    }
  )
  // ─── GET /payments/:id ────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await paymentService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /payments ───────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const { paymentDate, ...rest } = body;
      const data = await paymentService.create({
        ...rest,
        paymentDate: new Date(paymentDate),
      });
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        invoiceId: t.Number(),
        amount: t.String(),
        paymentMethod: t.Union(paymentMethodValues.map((m) => t.Literal(m))),
        paymentDate: t.String(),
        referenceNumber: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        recordedById: t.Optional(t.Number()),
      }),
    }
  )
  // ─── DELETE /payments/:id ─────────────────────────────────────────────────
  // Cannot delete payments from a paid invoice
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await paymentService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
