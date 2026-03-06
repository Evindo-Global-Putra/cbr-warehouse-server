import { ShipmentRepository } from "../repositories/shipment.repository";
import { LoadingFormRepository } from "../repositories/loading-form.repository";
import { shipments } from "../db/schema";

type Shipment = typeof shipments.$inferSelect;
type NewShipment = typeof shipments.$inferInsert;
type UpdateShipment = Partial<Omit<NewShipment, "id" | "createdAt">>;

export class ShipmentService {
  constructor(
    private repo: ShipmentRepository,
    private loadingFormRepo: LoadingFormRepository
  ) {}

  async getAll(): Promise<Shipment[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Shipment> {
    const shipment = await this.repo.findById(id);
    if (!shipment) throw new Error(`Shipment with id ${id} not found`);
    return shipment;
  }

  async getByLoadingForm(loadingFormId: number): Promise<Shipment[]> {
    return this.repo.findByLoadingForm(loadingFormId);
  }

  async getByStatus(status: Shipment["status"]): Promise<Shipment[]> {
    return this.repo.findByStatus(status);
  }

  async getByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.repo.findByTrackingNumber(trackingNumber);
    if (!shipment) {
      throw new Error(`Shipment with tracking number '${trackingNumber}' not found`);
    }
    return shipment;
  }

  async create(data: NewShipment): Promise<Shipment> {
    const form = await this.loadingFormRepo.findById(data.loadingFormId);
    if (!form) {
      throw new Error(`Loading form with id ${data.loadingFormId} not found`);
    }
    if (form.status !== "validated") {
      throw new Error(
        `Cannot create a shipment for a loading form that is not validated (current status: '${form.status}')`
      );
    }
    return this.repo.create(data);
  }

  async markInTransit(id: number): Promise<Shipment> {
    const shipment = await this.getById(id);
    if (shipment.status !== "pending") {
      throw new Error(
        `Shipment id ${id} cannot be marked in-transit (current status: '${shipment.status}')`
      );
    }
    const updated = await this.repo.update(id, {
      status: "in_transit",
      shippedAt: new Date(),
    });
    if (!updated) throw new Error(`Failed to update shipment with id ${id}`);
    return updated;
  }

  async markArrived(id: number): Promise<Shipment> {
    const shipment = await this.getById(id);
    if (shipment.status !== "in_transit") {
      throw new Error(
        `Shipment id ${id} cannot be marked arrived (current status: '${shipment.status}')`
      );
    }
    const updated = await this.repo.update(id, {
      status: "arrived",
      actualArrival: new Date(),
    });
    if (!updated) throw new Error(`Failed to update shipment with id ${id}`);
    return updated;
  }

  async markDelivered(id: number): Promise<Shipment> {
    const shipment = await this.getById(id);
    if (shipment.status !== "arrived") {
      throw new Error(
        `Shipment id ${id} cannot be marked delivered (current status: '${shipment.status}')`
      );
    }
    const updated = await this.repo.update(id, { status: "delivered" });
    if (!updated) throw new Error(`Failed to update shipment with id ${id}`);
    return updated;
  }

  async update(id: number, data: UpdateShipment): Promise<Shipment> {
    await this.getById(id);
    const updated = await this.repo.update(id, data);
    if (!updated) throw new Error(`Failed to update shipment with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<Shipment> {
    const shipment = await this.getById(id);
    if (shipment.status !== "pending") {
      throw new Error(
        `Only pending shipments can be deleted (current status: '${shipment.status}')`
      );
    }
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Failed to delete shipment with id ${id}`);
    return deleted;
  }
}
