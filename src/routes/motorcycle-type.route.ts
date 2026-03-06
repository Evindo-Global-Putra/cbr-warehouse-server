import { Elysia, t } from "elysia";
// import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { MotorcycleTypeRepository } from "../repositories/motorcycle-type.repository";
import { MotorcycleTypeService } from "../services/motorcycle-type.service";

const motorcycleTypeService = new MotorcycleTypeService(
  new MotorcycleTypeRepository(db)
);

export const motorcycleTypeRoutes = new Elysia({ prefix: "/motorcycle-types" })
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

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /motorcycle-types ────────────────────────────────────────────────
  .get("/", async () => {
    const data = await motorcycleTypeService.getAll();
    return { success: true, data };
  })
  // ─── GET /motorcycle-types/brand/:brand ───────────────────────────────────
  .get(
    "/brand/:brand",
    async ({ params }) => {
      const data = await motorcycleTypeService.getByBrand(params.brand);
      return { success: true, data };
    },
    {
      params: t.Object({ brand: t.String() }),
    }
  )
  // ─── GET /motorcycle-types/:id ────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await motorcycleTypeService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  // ─── POST /motorcycle-types ───────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const data = await motorcycleTypeService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        brand: t.String({ minLength: 1 }),
        model: t.String({ minLength: 1 }),
        engineCc: t.Optional(t.Number()),
      }),
    }
  )
  // ─── PUT /motorcycle-types/:id ────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await motorcycleTypeService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        brand: t.Optional(t.String({ minLength: 1 })),
        model: t.Optional(t.String({ minLength: 1 })),
        engineCc: t.Optional(t.Number()),
      }),
    }
  )
  // ─── DELETE /motorcycle-types/:id ─────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await motorcycleTypeService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  );
