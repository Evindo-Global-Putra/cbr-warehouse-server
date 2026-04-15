import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { UserRepository } from "../repositories/user.repository";

export type UserRole = "super_admin" | "admin_export" | "admin_warehouse" | "finance";

const userRepo = new UserRepository(db);

export const authPlugin = new Elysia({ name: "auth-plugin" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    }),
  )
  .derive({ as: "scoped" }, async ({ headers, jwt }) => {
    const auth = headers["authorization"];
    if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const payload = await jwt.verify(auth.slice(7));
    if (!payload) throw new Error("Unauthorized");

    // Fetch user from DB to validate isActive and tokenVersion
    const user = await userRepo.findById(payload.sub as string);
    if (!user || !user.isActive) throw new Error("Unauthorized");
    if (user.tokenVersion !== Number(payload.tokenVersion)) throw new Error("Unauthorized");

    return {
      currentUser: {
        id: user.id,
        role: user.role as UserRole,
        branchId: user.branchId ?? undefined,
      },
    };
  });

/**
 * Throws "Forbidden" (caught by route onError → 403) if the current
 * user's role is not in the allowed list.
 */
export function requireRole(allowed: UserRole[], role: UserRole): void {
  if (!allowed.includes(role)) throw new Error("Forbidden");
}
