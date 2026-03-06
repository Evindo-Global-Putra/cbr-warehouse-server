import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { shipments } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type Shipment = typeof shipments.$inferSelect;
type NewShipment = typeof shipments.$inferInsert;
type UpdateShipment = Partial<Omit<NewShipment, "id" | "createdAt">>;

export class ShipmentRepository {
  constructor(private db: DB) {}

  async findAll(): Promise<Shipment[]> {
    return this.db.select().from(shipments);
  }

  async findById(id: number): Promise<Shipment | undefined> {
    const result = await this.db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));
    return result[0];
  }

  async findByLoadingForm(loadingFormId: number): Promise<Shipment[]> {
    return this.db
      .select()
      .from(shipments)
      .where(eq(shipments.loadingFormId, loadingFormId));
  }

  async findByStatus(status: Shipment["status"]): Promise<Shipment[]> {
    return this.db
      .select()
      .from(shipments)
      .where(eq(shipments.status, status));
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined> {
    const result = await this.db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));
    return result[0];
  }

  async create(data: NewShipment): Promise<Shipment> {
    const result = await this.db.insert(shipments).values(data).returning();
    return result[0];
  }

  async update(id: number, data: UpdateShipment): Promise<Shipment | undefined> {
    const result = await this.db
      .update(shipments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<Shipment | undefined> {
    const result = await this.db
      .delete(shipments)
      .where(eq(shipments.id, id))
      .returning();
    return result[0];
  }
}
