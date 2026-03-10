import { Elysia, t } from "elysia";
import { db } from "../db";
import { PackingListItemRepository } from "../repositories/packing-list-item.repository";
import { PackingListRepository } from "../repositories/packing-list.repository";
import { PackingListItemService } from "../services/packing-list-item.service";

const packingListItemService = new PackingListItemService(
  new PackingListItemRepository(db),
  new PackingListRepository(db)
);

export const packingListItemRoutes = new Elysia({ prefix: "/packing-list-items" })
  .onError(({ error, set }) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.toLowerCase().includes("not found")) {
      set.status = 404;
      return { success: false, message };
    }

    set.status = 500;
    return { success: false, message: "Internal server error" };
  })
  // ─── GET /packing-list-items ──────────────────────────────────────────────
  .get("/", async () => {
    const data = await packingListItemService.getAll();
    return { success: true, data };
  })
  // ─── GET /packing-list-items/packing-list/:packingListId ──────────────────
  // Returns items ordered by sortOrder (matches printed packing list line order)
  .get(
    "/packing-list/:packingListId",
    async ({ params }) => {
      const data = await packingListItemService.getByPackingList(
        params.packingListId
      );
      return { success: true, data };
    },
    { params: t.Object({ packingListId: t.Numeric() }) }
  )
  // ─── GET /packing-list-items/:id ──────────────────────────────────────────
  .get(
    "/:id",
    async ({ params }) => {
      const data = await packingListItemService.getById(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  // ─── POST /packing-list-items ─────────────────────────────────────────────
  // After insert, parent packing list totals are auto-recomputed.
  .post(
    "/",
    async ({ body, set }) => {
      const data = await packingListItemService.create(body);
      set.status = 201;
      return { success: true, data };
    },
    {
      body: t.Object({
        packingListId: t.Number(),
        description: t.String({ minLength: 1 }),
        motorcycleTypeId: t.Optional(t.Number()),
        accessoryId: t.Optional(t.Number()),
        quantity: t.Number({ minimum: 1 }),
        grossWeight: t.String(), // total kg for this line, numeric string
        netWeight: t.String(),   // total kg for this line, numeric string
        sortOrder: t.Optional(t.Number()),
      }),
    }
  )
  // ─── PUT /packing-list-items/:id ──────────────────────────────────────────
  // After update, parent packing list totals are auto-recomputed.
  .put(
    "/:id",
    async ({ params, body }) => {
      const data = await packingListItemService.update(params.id, body);
      return { success: true, data };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        description: t.Optional(t.String({ minLength: 1 })),
        motorcycleTypeId: t.Optional(t.Nullable(t.Number())),
        accessoryId: t.Optional(t.Nullable(t.Number())),
        quantity: t.Optional(t.Number({ minimum: 1 })),
        grossWeight: t.Optional(t.String()),
        netWeight: t.Optional(t.String()),
        sortOrder: t.Optional(t.Number()),
      }),
    }
  )
  // ─── DELETE /packing-list-items/:id ───────────────────────────────────────
  // After delete, parent packing list totals are auto-recomputed.
  .delete(
    "/:id",
    async ({ params }) => {
      const data = await packingListItemService.delete(params.id);
      return { success: true, data };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
