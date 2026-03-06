import { Elysia, t } from "elysia";
// import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { SupplierRepository } from "../repositories/supplier.repository";
import { SupplierService } from "../services/supplier.service";

const supplierService = new SupplierService(new SupplierRepository(db));

export const supplierRoutes = new Elysia({ prefix: "/suppliers" })
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

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /suppliers ───────────────────────────────────────────────────────
  .get("/", async () => {
    const data = await supplierService.getAll();
    return { success: true, data };
  })
  // ─── GET /suppliers/search?name= ──────────────────────────────────────────
  .get(
    "/search",
    async ({ query }) => {
      const data = await supplierService.search(query.name);
      return { success: true, data };
    },
    {
      query: t.Object({ name: t.String({ minLength: 1 }) }),
    }
  )
  // ─── GET /suppliers/country/:country ──────────────────────────────────────
  .get(
    "/country/:country",
    async ({ params }) => {
      const data = await supplierService.getByCountry(params.country);
      return { success: true, data };
    },
    {
      params: t.Object({ country: t.String() }),
    }
  )
  // ─── GET /suppliers/:id ───────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await supplierService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  // ─── POST /suppliers ──────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const data = await supplierService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        country: t.Optional(t.String()),
        contactName: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        address: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )
  // ─── PUT /suppliers/:id ───────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await supplierService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        country: t.Optional(t.String()),
        contactName: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        address: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )
  // ─── DELETE /suppliers/:id ────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await supplierService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  );
