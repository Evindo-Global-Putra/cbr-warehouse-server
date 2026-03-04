import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";

const userService = new UserService(new UserRepository(db));

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("already exists")) {
      set.status = 409;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── Register ─────────────────────────────────────────────────────────────
  .post(
    "/register",
    async ({ body, set }) => {
      const passwordHash = await Bun.password.hash(body.password);

      const user = await userService
        .create({
          name: body.name,
          email: body.email,
          passwordHash,
          role: body.role ?? "super_admin",
          branchId: body.branchId ?? null,
        })
        .catch((err: Error) => {
          throw err;
        });

      set.status = 201;
      const { passwordHash: _, ...safeUser } = user;
      return { success: true, data: safeUser };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
        role: t.Optional(
          t.Union([
            t.Literal("super_admin"),
            t.Literal("admin_export"),
            t.Literal("admin_warehouse"),
            t.Literal("finance"),
          ]),
        ),
        branchId: t.Optional(t.Number()),
      }),
    },
  )
  // ─── Login ────────────────────────────────────────────────────────────────
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const user = await userService.getByEmail(body.email).catch(() => null);

      if (!user || !user.isActive) {
        set.status = 401;
        return { success: false, message: "Invalid credentials" };
      }

      const valid = await Bun.password.verify(body.password, user.passwordHash);
      if (!valid) {
        set.status = 401;
        return { success: false, message: "Invalid credentials" };
      }

      const token = await jwt.sign({
        sub: String(user.id),
        role: user.role,
        branchId: user.branchId ?? undefined,
      });

      const { passwordHash, ...safeUser } = user;
      return { success: true, data: { token, user: safeUser } };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    },
  )
  // ─── Me (get current authenticated user) ─────────────────────────────────
  .get("/me", async ({ headers, jwt, set }) => {
    const auth = headers["authorization"];
    if (!auth?.startsWith("Bearer ")) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    const payload = await jwt.verify(auth.slice(7));
    if (!payload) {
      set.status = 401;
      return { success: false, message: "Invalid or expired token" };
    }

    const user = await userService
      .getById(Number(payload.sub))
      .catch(() => null);
    if (!user || !user.isActive) {
      set.status = 401;
      return { success: false, message: "Unauthorized" };
    }

    const { passwordHash, ...safeUser } = user;
    return { success: true, data: safeUser };
  });
