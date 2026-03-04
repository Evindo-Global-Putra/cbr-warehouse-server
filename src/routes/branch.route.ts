import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { BranchRepository } from "../repositories/branch.repository";
import { BranchService } from "../services/branch.service";

const branchService = new BranchService(new BranchRepository(db));

export const branchRoutes = new Elysia({ prefix: "/branches" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  // ─── Auth guard (applies to all routes below) ─────────────────────────────
  .derive(async ({ headers, jwt }) => {
    const auth = headers["authorization"];
    if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const payload = await jwt.verify(auth.slice(7));
    if (!payload) throw new Error("Unauthorized");

    return { currentUser: payload };
  })
  // ─── Error handler ────────────────────────────────────────────────────────
  .onError(({ error, set }) => {
    const message = error instanceof Error ? error.message : "Internal server error";

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
      message.toLowerCase().includes("already taken")
    ) {
      set.status = 409;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /branches ────────────────────────────────────────────────────────
  .get("/", async () => {
    const data = await branchService.getAll();
    return { success: true, data };
  })
  // ─── GET /branches/code/:code ─────────────────────────────────────────────
  .get(
    "/code/:code",
    async ({ params }) => {
      const data = await branchService.getByCode(params.code);
      return { success: true, data };
    },
    {
      params: t.Object({ code: t.String() }),
    }
  )
  // ─── GET /branches/:id ────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await branchService.getById(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  )
  // ─── POST /branches ───────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, set }) => {
      const data = await branchService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        code: t.String({ minLength: 1, maxLength: 10 }),
        address: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    }
  )
  // ─── PUT /branches/:id ────────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await branchService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        code: t.Optional(t.String({ minLength: 1, maxLength: 10 })),
        address: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
    }
  )
  // ─── DELETE /branches/:id ─────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await branchService.delete(params.id);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  );
