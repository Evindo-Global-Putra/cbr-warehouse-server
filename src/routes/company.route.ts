import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { CompanyRepository } from "../repositories/company.repository";
import { CompanyService } from "../services/company.service";

const companyService = new CompanyService(new CompanyRepository(db));

export const companyRoutes = new Elysia({ prefix: "/companies" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  // ─── Auth guard ───────────────────────────────────────────────────────────
  .derive(async ({ headers, jwt }) => {
    const auth = headers["authorization"];
    if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const payload = await jwt.verify(auth.slice(7));
    if (!payload) throw new Error("Unauthorized");

    return { currentUser: payload };
  })
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
    if (
      message.toLowerCase().includes("already exists") ||
      message.toLowerCase().includes("already registered")
    ) {
      set.status = 409;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /companies ───────────────────────────────────────────────────────
  .get("/", async () => {
    const data = await companyService.getAll();
    return { success: true, data };
  })
  // ─── GET /companies/search?name= ──────────────────────────────────────────
  .get(
    "/search",
    async ({ query }) => {
      const data = await companyService.search(query.name);
      return { success: true, data };
    },
    {
      query: t.Object({ name: t.String({ minLength: 1 }) }),
    }
  )
  // ─── GET /companies/country/:country ──────────────────────────────────────
  .get(
    "/country/:country",
    async ({ params }) => {
      const data = await companyService.getByCountry(params.country);
      return { success: true, data };
    },
    {
      params: t.Object({ country: t.String() }),
    }
  )
  // ─── GET /companies/npwp/:npwp ────────────────────────────────────────────
  .get(
    "/npwp/:npwp",
    async ({ params }) => {
      const data = await companyService.getByNpwp(params.npwp);
      return { success: true, data };
    },
    {
      params: t.Object({ npwp: t.String() }),
    }
  )
  // ─── GET /companies/:id ───────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await companyService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  // ─── POST /companies ──────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const data = await companyService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        country: t.String({ minLength: 1 }),
        contactName: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        address: t.Optional(t.String()),
        npwp: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )
  // ─── PUT /companies/:id ───────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await companyService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        country: t.Optional(t.String({ minLength: 1 })),
        contactName: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        address: t.Optional(t.String()),
        npwp: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )
  // ─── DELETE /companies/:id ────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await companyService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  );
