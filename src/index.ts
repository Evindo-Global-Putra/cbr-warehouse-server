import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth.route";
import { branchRoutes } from "./routes/branch.route";
import { companyRoutes } from "./routes/company.route";
import { supplierRoutes } from "./routes/supplier.route";
import { motorcycleTypeRoutes } from "./routes/motorcycle-type.route";
import { travelPermitRoutes } from "./routes/travel-permit.route";
import { warehouseEntryRoutes } from "./routes/warehouse-entry.route";
import { motorcycleRoutes } from "./routes/motorcycle.route";
import { accessoryRoutes } from "./routes/accessory.route";
import { exportOrderRoutes } from "./routes/export-order.route";
import { exportOrderItemRoutes } from "./routes/export-order-item.route";
import { exportOrderMotorcycleRoutes } from "./routes/export-order-motorcycle.route";
import { loadingFormRoutes } from "./routes/loading-form.route";
import { shipmentRoutes } from "./routes/shipment.route";
import { invoiceRoutes } from "./routes/invoice.route";
import { invoiceItemRoutes } from "./routes/invoice-item.route";
import { packingListRoutes } from "./routes/packing-list.route";
import { packingListItemRoutes } from "./routes/packing-list-item.route";
import { paymentRoutes } from "./routes/payment.route";
import { warehouseTransferRoutes } from "./routes/warehouse-transfer.route";
import { warehouseTransferMotorcycleRoutes } from "./routes/warehouse-transfer-motorcycle.route";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "CBR Warehouse API",
          version: "1.0.0",
        },
      },
    }),
  )
  .group("/api/v1", (app) =>
    app
      .use(authRoutes)
      .use(branchRoutes)
      .use(companyRoutes)
      .use(supplierRoutes)
      .use(motorcycleTypeRoutes)
      .use(travelPermitRoutes)
      .use(warehouseEntryRoutes)
      .use(motorcycleRoutes)
      .use(accessoryRoutes)
      .use(exportOrderRoutes)
      .use(exportOrderItemRoutes)
      .use(exportOrderMotorcycleRoutes)
      .use(loadingFormRoutes)
      .use(shipmentRoutes)
      .use(invoiceRoutes)
      .use(invoiceItemRoutes)
      .use(packingListRoutes)
      .use(packingListItemRoutes)
      .use(paymentRoutes)
      .use(warehouseTransferRoutes)
      .use(warehouseTransferMotorcycleRoutes),
  )
  .listen(process.env.PORT ?? 3000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
