import { Elysia, t } from "elysia";
import { db } from "../db";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";
import { authPlugin, requireRole } from "../plugins/auth.plugin";

const userService = new UserService(new UserRepository(db));

const safeUser = (user: Record<string, unknown>) => {
  const { passwordHash: _, ...safe } = user as { passwordHash: unknown; [key: string]: unknown };
  return safe;
};

export const userRoutes = new Elysia({
  prefix: "/users",
  detail: { tags: ["Users"] },
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
      message.toLowerCase().includes("already exists") ||
      message.toLowerCase().includes("already taken")
    ) {
      set.status = 409;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /users ───────────────────────────────────────────────────────────
  .get("/", async ({ currentUser }) => {
    requireRole(["super_admin"], currentUser.role);
    const users = await userService.getAll();
    return { success: true, data: users.map(safeUser) };
  })
  // ─── GET /users/:id ───────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin"], currentUser.role);
      const user = await userService.getById(params.id);
      return { success: true, data: safeUser(user as Record<string, unknown>) };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // ─── PUT /users/:id ───────────────────────────────────────────────────────
  .put(
    "/:id",
    async ({ params, body, currentUser }) => {
      requireRole(["super_admin"], currentUser.role);
      const user = await userService.update(params.id, body);
      return { success: true, data: safeUser(user as Record<string, unknown>) };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String({ format: "email" })),
        role: t.Optional(
          t.Union([
            t.Literal("super_admin"),
            t.Literal("admin_export"),
            t.Literal("admin_warehouse"),
            t.Literal("finance"),
          ]),
        ),
        branchId: t.Optional(t.Nullable(t.String())),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )
  // ─── DELETE /users/:id ────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ params, currentUser }) => {
      requireRole(["super_admin"], currentUser.role);
      const user = await userService.delete(params.id);
      return { success: true, data: safeUser(user as Record<string, unknown>) };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  );
