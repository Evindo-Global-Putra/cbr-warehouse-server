import { Elysia, t } from "elysia";
// import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { TravelPermitRepository } from "../repositories/travel-permit.repository";
import { TravelPermitService } from "../services/travel-permit.service";

const travelPermitService = new TravelPermitService(
  new TravelPermitRepository(db)
);

export const travelPermitRoutes = new Elysia({ prefix: "/travel-permits" })
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
    if (message.toLowerCase().includes("already exists")) {
      set.status = 409;
      return { success: false, message };
    }
    if (message.toLowerCase().includes("cannot transition") ||
        message.toLowerCase().includes("only pending")) {
      set.status = 422;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
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
      params: t.Object({
        status: t.Union([
          t.Literal("pending"),
          t.Literal("received"),
          t.Literal("completed"),
        ]),
      }),
    }
  )
  // ─── GET /travel-permits/supplier/:supplierId ─────────────────────────────
  .get(
    "/supplier/:supplierId",
    async ({ params }) => {
      const data = await travelPermitService.getBySupplier(params.supplierId);
      return { success: true, data };
    },
    {
      params: t.Object({ supplierId: t.Numeric() }),
    }
  )
  // ─── GET /travel-permits/branch/:branchId ────────────────────────────────
  .get(
    "/branch/:branchId",
    async ({ params }) => {
      const data = await travelPermitService.getByBranch(params.branchId);
      return { success: true, data };
    },
    {
      params: t.Object({ branchId: t.Numeric() }),
    }
  )
  // ─── GET /travel-permits/permit/:permitNumber ─────────────────────────────
  .get(
    "/permit/:permitNumber",
    async ({ params }) => {
      const data = await travelPermitService.getByPermitNumber(
        params.permitNumber
      );
      return { success: true, data };
    },
    {
      params: t.Object({ permitNumber: t.String() }),
    }
  )
  // ─── GET /travel-permits/:id ──────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await travelPermitService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  // ─── POST /travel-permits ─────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
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
        supplierId: t.Number(),
        branchId: t.Number(),
        totalUnits: t.Number({ minimum: 1 }),
        truckPoliceNumber: t.Optional(t.String()),
        driverName: t.Optional(t.String()),
        issuedDate: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        createdById: t.Optional(t.Number()),
      }),
    }
  )
  // ─── PATCH /travel-permits/:id/status ────────────────────────────────────
  // Advance the SJ through its lifecycle: pending → received → completed
  .patch(
    "/:id/status",
    async ({ params, body }) => {
      const data = await travelPermitService.updateStatus(params.id, body.status);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        status: t.Union([
          t.Literal("pending"),
          t.Literal("received"),
          t.Literal("completed"),
        ]),
      }),
    }
  )
  // ─── PUT /travel-permits/:id ──────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await travelPermitService.update(params.id, {
        ...body,
        issuedDate: body.issuedDate ? new Date(body.issuedDate) : undefined,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : undefined,
      });
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        permitNumber: t.Optional(t.String({ minLength: 1 })),
        supplierId: t.Optional(t.Number()),
        branchId: t.Optional(t.Number()),
        totalUnits: t.Optional(t.Number({ minimum: 1 })),
        truckPoliceNumber: t.Optional(t.String()),
        driverName: t.Optional(t.String()),
        issuedDate: t.Optional(t.String()),
        receivedDate: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )
  // ─── DELETE /travel-permits/:id ───────────────────────────────────────────
  // Only pending permits can be deleted
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await travelPermitService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  );
