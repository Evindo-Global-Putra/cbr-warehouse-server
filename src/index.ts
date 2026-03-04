import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth.route";
import { branchRoutes } from "./routes/branch.route";
import { companyRoutes } from "./routes/company.route";
import { supplierRoutes } from "./routes/supplier.route";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "CBR Warehouse API",
          version: "1.0.0",
        },
      },
    })
  )
  .group("/api/v1", (app) =>
    app
      .use(authRoutes)
      .use(branchRoutes)
      .use(companyRoutes)
      .use(supplierRoutes)
  )
  .listen(process.env.PORT ?? 3000);

console.log(
  `Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
