import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin_export",
  "admin_warehouse",
  "finance",
]);

export const motorcycleStatusEnum = pgEnum("motorcycle_status", [
  "on_site",
  "loading",
  "exported",
  "transferred",
]);

export const travelPermitStatusEnum = pgEnum("travel_permit_status", [
  "pending",
  "received",
  "completed",
]);

export const warehouseEntryStatusEnum = pgEnum("warehouse_entry_status", [
  "in_progress",
  "completed",
]);

export const exportOrderStatusEnum = pgEnum("export_order_status", [
  "pending",
  "confirmed",
  "in_progress",
  "loading",
  "shipped",
  "completed",
  "cancelled",
]);

export const loadingFormStatusEnum = pgEnum("loading_form_status", [
  "draft",
  "confirmed",
  "validated",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "pending",
  "in_transit",
  "arrived",
  "delivered",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer",
  "cash",
  "check",
  "other",
]);

export const transferStatusEnum = pgEnum("transfer_status", [
  "pending",
  "in_transit",
  "completed",
  "cancelled",
]);

// ─── Branches (Warehouse locations: Jakarta, Surabaya, etc.) ─────────────────

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  address: text("address"),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  branchId: integer("branch_id").references(() => branches.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  country: varchar("country", { length: 100 }),
  contactName: varchar("contact_name", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Companies (B2B clients / dealers / distributors) ────────────────────────

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  email: text("email"),
  address: text("address"),
  npwp: varchar("npwp", { length: 30 }), // Indonesian tax ID
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Motorcycle Types (catalog: brand + model + variant) ─────────────────────

export const motorcycleTypes = pgTable("motorcycle_types", {
  id: serial("id").primaryKey(),
  brand: varchar("brand", { length: 100 }).notNull(), // Honda, Yamaha, Suzuki, Kawasaki
  model: varchar("model", { length: 100 }).notNull(), // Beat Street, Aerox 155, NMAX NEO
  variant: varchar("variant", { length: 100 }), // KEY, KEYLESS, STD, CYBERCITY, ALPHA, etc.
  engineCc: integer("engine_cc"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Travel Permits / Surat Jalan (SJ) ───────────────────────────────────────
// Delivery documents sent by suppliers along with each incoming shipment.

export const travelPermits = pgTable("travel_permits", {
  id: serial("id").primaryKey(),
  permitNumber: varchar("permit_number", { length: 50 }).notNull().unique(), // e.g., SO1001
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  branchId: integer("branch_id") // destination warehouse
    .notNull()
    .references(() => branches.id),
  truckPoliceNumber: varchar("truck_police_number", { length: 20 }),
  driverName: varchar("driver_name", { length: 100 }),
  totalUnits: integer("total_units").notNull(),
  status: travelPermitStatusEnum("status").notNull().default("pending"),
  issuedDate: timestamp("issued_date"),
  receivedDate: timestamp("received_date"),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Warehouse Entries (Entry Gudang sessions) ────────────────────────────────
// A session in which Admin Warehouse scans and records all units arriving under a travel permit.

export const warehouseEntries = pgTable("warehouse_entries", {
  id: serial("id").primaryKey(),
  travelPermitId: integer("travel_permit_id")
    .notNull()
    .references(() => travelPermits.id),
  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id),
  totalUnitsExpected: integer("total_units_expected").notNull(),
  totalUnitsScanned: integer("total_units_scanned").notNull().default(0),
  status: warehouseEntryStatusEnum("status").notNull().default("in_progress"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ─── Motorcycles (individual units, VIN-level) ────────────────────────────────
// Each motorcycle is scanned into the system during warehouse entry.

export const motorcycles = pgTable("motorcycles", {
  id: serial("id").primaryKey(),
  noInduk: varchar("no_induk", { length: 50 }).notNull().unique(), // master registration code
  typeId: integer("type_id")
    .notNull()
    .references(() => motorcycleTypes.id),
  color: varchar("color", { length: 50 }).notNull(),
  frameNumber: varchar("frame_number", { length: 50 }).notNull().unique(),
  engineNumber: varchar("engine_number", { length: 50 }).notNull().unique(),
  barcode: varchar("barcode", { length: 100 }).unique(), // generated after entry
  status: motorcycleStatusEnum("status").notNull().default("on_site"),
  branchId: integer("branch_id") // current warehouse location
    .notNull()
    .references(() => branches.id),
  entryId: integer("entry_id").references(() => warehouseEntries.id),
  frontPhotoUrl: text("front_photo_url"),
  framePhotoUrl: text("frame_photo_url"),
  enginePhotoUrl: text("engine_photo_url"),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Accessories ──────────────────────────────────────────────────────────────

export const accessories = pgTable("accessories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  quantityInStock: integer("quantity_in_stock").notNull().default(0),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  // Weight per unit — used for packing list calculations
  grossWeightPerUnit: numeric("gross_weight_per_unit", { precision: 8, scale: 2 }), // kg
  netWeightPerUnit: numeric("net_weight_per_unit", { precision: 8, scale: 2 }), // kg
  branchId: integer("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Export Orders (client B2B requests) ─────────────────────────────────────
// Created by Admin Export when a client requests units.

export const exportOrders = pgTable("export_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(), // e.g., EXP-2025-001
  clientId: integer("client_id")
    .notNull()
    .references(() => companies.id),
  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id),
  status: exportOrderStatusEnum("status").notNull().default("pending"),
  requestedUnits: integer("requested_units").notNull(),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Export Order Items (type + quantity breakdown requested by the client) ───
// Each line is either a motorcycle type or an accessory (e.g., helmets).
// Exactly one of motorcycleTypeId or accessoryId must be set.

export const exportOrderItems = pgTable("export_order_items", {
  id: serial("id").primaryKey(),
  exportOrderId: integer("export_order_id")
    .notNull()
    .references(() => exportOrders.id),
  // One of these two must be set (motorcycle line or accessory line)
  motorcycleTypeId: integer("motorcycle_type_id").references(
    () => motorcycleTypes.id,
  ),
  accessoryId: integer("accessory_id").references(() => accessories.id),
  quantityRequested: integer("quantity_requested").notNull(),
  quantityAssigned: integer("quantity_assigned").notNull().default(0),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  notes: text("notes"), // e.g., color preference or special instructions
});

// ─── Export Order Motorcycles (actual units assigned to an order) ─────────────

export const exportOrderMotorcycles = pgTable("export_order_motorcycles", {
  id: serial("id").primaryKey(),
  exportOrderId: integer("export_order_id")
    .notNull()
    .references(() => exportOrders.id),
  motorcycleId: integer("motorcycle_id")
    .notNull()
    .references(() => motorcycles.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// ─── Loading Forms (preparation step before export shipment) ─────────────────
// Created by Admin Warehouse after matching catalog units to the export order.

export const loadingForms = pgTable("loading_forms", {
  id: serial("id").primaryKey(),
  exportOrderId: integer("export_order_id")
    .notNull()
    .references(() => exportOrders.id),
  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id),
  truckPoliceNumber: varchar("truck_police_number", { length: 20 }),
  status: loadingFormStatusEnum("status").notNull().default("draft"),
  validatedById: integer("validated_by_id").references(() => users.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Shipments (export delivery tracking) ────────────────────────────────────

export const shipments = pgTable("shipments", {
  id: serial("id").primaryKey(),
  loadingFormId: integer("loading_form_id")
    .notNull()
    .references(() => loadingForms.id),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  carrier: varchar("carrier", { length: 100 }),
  destinationCountry: varchar("destination_country", { length: 100 }),
  status: shipmentStatusEnum("status").notNull().default("pending"),
  shippedAt: timestamp("shipped_at"),
  estimatedArrival: timestamp("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
// Format: NN/CBR-IMS/MM/YYYY (e.g., 09/CBR-IMS/IV/2025)

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(), // 09/CBR-IMS/IV/2025
  exportOrderId: integer("export_order_id")
    .notNull()
    .references(() => exportOrders.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => companies.id),
  // Shipment info
  vessel: varchar("vessel", { length: 200 }),            // ship/vessel name
  etd: timestamp("etd"),                                 // Estimated Time of Departure
  fromPort: varchar("from_port", { length: 200 }),       // origin port
  toPort: varchar("to_port", { length: 200 }),           // destination port
  shippingTerm: varchar("shipping_term", { length: 50 }), // e.g., CNF BEIRUT
  countryOfOrigin: varchar("country_of_origin", { length: 100 }).default("Indonesia"),
  // Financials (USD)
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  freightAmount: numeric("freight_amount", { precision: 14, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  dueDate: timestamp("due_date"),
  issuedAt: timestamp("issued_at"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Invoice Items (line items per invoice) ───────────────────────────────────
// Each row = one description line (motorcycle model or accessory).
// description mirrors what appears on the printed invoice (e.g., "YAMAHA NMAX NEO (KEY)").

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  description: varchar("description", { length: 300 }).notNull(), // printed description of goods
  // Optional FK links for traceability (not required for printing)
  motorcycleTypeId: integer("motorcycle_type_id").references(
    () => motorcycleTypes.id,
  ),
  accessoryId: integer("accessory_id").references(() => accessories.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(), // USD
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),        // qty × unit_price
  sortOrder: integer("sort_order").notNull().default(0), // display order on document
});

// ─── Packing Lists (linked 1:1 to an invoice) ────────────────────────────────
// Shares the same invoice number. Contains weight details for customs & logistics.

export const packingLists = pgTable("packing_lists", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .unique() // 1:1 with invoice
    .references(() => invoices.id),
  shippingTerm: varchar("shipping_term", { length: 50 }), // mirrors invoice (e.g., CNF BEIRUT)
  // Totals (computed / stored for quick access)
  totalQuantity: integer("total_quantity").notNull().default(0),
  totalGrossWeight: numeric("total_gross_weight", { precision: 10, scale: 2 }), // kg
  totalNetWeight: numeric("total_net_weight", { precision: 10, scale: 2 }),     // kg
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Packing List Items (line items per packing list) ────────────────────────

export const packingListItems = pgTable("packing_list_items", {
  id: serial("id").primaryKey(),
  packingListId: integer("packing_list_id")
    .notNull()
    .references(() => packingLists.id),
  description: varchar("description", { length: 300 }).notNull(), // same item list as invoice
  // Optional FK links for traceability
  motorcycleTypeId: integer("motorcycle_type_id").references(
    () => motorcycleTypes.id,
  ),
  accessoryId: integer("accessory_id").references(() => accessories.id),
  quantity: integer("quantity").notNull(),
  grossWeight: numeric("gross_weight", { precision: 10, scale: 2 }).notNull(), // total kg for this line
  netWeight: numeric("net_weight", { precision: 10, scale: 2 }).notNull(),     // total kg for this line
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }),
  paymentDate: timestamp("payment_date").notNull(),
  notes: text("notes"),
  recordedById: integer("recorded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Warehouse Transfers (stock movement between branches) ────────────────────

export const warehouseTransfers = pgTable("warehouse_transfers", {
  id: serial("id").primaryKey(),
  fromBranchId: integer("from_branch_id")
    .notNull()
    .references(() => branches.id),
  toBranchId: integer("to_branch_id")
    .notNull()
    .references(() => branches.id),
  status: transferStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const warehouseTransferMotorcycles = pgTable(
  "warehouse_transfer_motorcycles",
  {
    id: serial("id").primaryKey(),
    transferId: integer("transfer_id")
      .notNull()
      .references(() => warehouseTransfers.id),
    motorcycleId: integer("motorcycle_id")
      .notNull()
      .references(() => motorcycles.id),
  },
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
  travelPermits: many(travelPermits),
  warehouseEntries: many(warehouseEntries),
  motorcycles: many(motorcycles),
  accessories: many(accessories),
  exportOrders: many(exportOrders),
  loadingForms: many(loadingForms),
  transfersFrom: many(warehouseTransfers, { relationName: "transferFrom" }),
  transfersTo: many(warehouseTransfers, { relationName: "transferTo" }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  travelPermits: many(travelPermits),
  warehouseEntries: many(warehouseEntries),
  exportOrders: many(exportOrders),
  loadingFormsCreated: many(loadingForms, { relationName: "createdBy" }),
  loadingFormsValidated: many(loadingForms, { relationName: "validatedBy" }),
  invoices: many(invoices),
  payments: many(payments),
  warehouseTransfers: many(warehouseTransfers),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  travelPermits: many(travelPermits),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  exportOrders: many(exportOrders),
  invoices: many(invoices),
}));

export const motorcycleTypesRelations = relations(
  motorcycleTypes,
  ({ many }) => ({
    motorcycles: many(motorcycles),
    exportOrderItems: many(exportOrderItems),
    invoiceItems: many(invoiceItems),
    packingListItems: many(packingListItems),
  }),
);

export const travelPermitsRelations = relations(
  travelPermits,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [travelPermits.supplierId],
      references: [suppliers.id],
    }),
    branch: one(branches, {
      fields: [travelPermits.branchId],
      references: [branches.id],
    }),
    createdBy: one(users, {
      fields: [travelPermits.createdById],
      references: [users.id],
    }),
    warehouseEntries: many(warehouseEntries),
  }),
);

export const warehouseEntriesRelations = relations(
  warehouseEntries,
  ({ one, many }) => ({
    travelPermit: one(travelPermits, {
      fields: [warehouseEntries.travelPermitId],
      references: [travelPermits.id],
    }),
    branch: one(branches, {
      fields: [warehouseEntries.branchId],
      references: [branches.id],
    }),
    createdBy: one(users, {
      fields: [warehouseEntries.createdById],
      references: [users.id],
    }),
    motorcycles: many(motorcycles),
  }),
);

export const motorcyclesRelations = relations(motorcycles, ({ one, many }) => ({
  type: one(motorcycleTypes, {
    fields: [motorcycles.typeId],
    references: [motorcycleTypes.id],
  }),
  branch: one(branches, {
    fields: [motorcycles.branchId],
    references: [branches.id],
  }),
  entry: one(warehouseEntries, {
    fields: [motorcycles.entryId],
    references: [warehouseEntries.id],
  }),
  exportOrderMotorcycles: many(exportOrderMotorcycles),
  transferMotorcycles: many(warehouseTransferMotorcycles),
}));

export const accessoriesRelations = relations(accessories, ({ one, many }) => ({
  branch: one(branches, {
    fields: [accessories.branchId],
    references: [branches.id],
  }),
  exportOrderItems: many(exportOrderItems),
  invoiceItems: many(invoiceItems),
  packingListItems: many(packingListItems),
}));

export const exportOrdersRelations = relations(
  exportOrders,
  ({ one, many }) => ({
    client: one(companies, {
      fields: [exportOrders.clientId],
      references: [companies.id],
    }),
    branch: one(branches, {
      fields: [exportOrders.branchId],
      references: [branches.id],
    }),
    createdBy: one(users, {
      fields: [exportOrders.createdById],
      references: [users.id],
    }),
    items: many(exportOrderItems),
    assignedMotorcycles: many(exportOrderMotorcycles),
    loadingForms: many(loadingForms),
    invoices: many(invoices),
  }),
);

export const exportOrderItemsRelations = relations(
  exportOrderItems,
  ({ one }) => ({
    exportOrder: one(exportOrders, {
      fields: [exportOrderItems.exportOrderId],
      references: [exportOrders.id],
    }),
    motorcycleType: one(motorcycleTypes, {
      fields: [exportOrderItems.motorcycleTypeId],
      references: [motorcycleTypes.id],
    }),
    accessory: one(accessories, {
      fields: [exportOrderItems.accessoryId],
      references: [accessories.id],
    }),
  }),
);

export const exportOrderMotorcyclesRelations = relations(
  exportOrderMotorcycles,
  ({ one }) => ({
    exportOrder: one(exportOrders, {
      fields: [exportOrderMotorcycles.exportOrderId],
      references: [exportOrders.id],
    }),
    motorcycle: one(motorcycles, {
      fields: [exportOrderMotorcycles.motorcycleId],
      references: [motorcycles.id],
    }),
  }),
);

export const loadingFormsRelations = relations(
  loadingForms,
  ({ one, many }) => ({
    exportOrder: one(exportOrders, {
      fields: [loadingForms.exportOrderId],
      references: [exportOrders.id],
    }),
    branch: one(branches, {
      fields: [loadingForms.branchId],
      references: [branches.id],
    }),
    validatedBy: one(users, {
      fields: [loadingForms.validatedById],
      references: [users.id],
      relationName: "validatedBy",
    }),
    createdBy: one(users, {
      fields: [loadingForms.createdById],
      references: [users.id],
      relationName: "createdBy",
    }),
    shipments: many(shipments),
  }),
);

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  loadingForm: one(loadingForms, {
    fields: [shipments.loadingFormId],
    references: [loadingForms.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  exportOrder: one(exportOrders, {
    fields: [invoices.exportOrderId],
    references: [exportOrders.id],
  }),
  client: one(companies, {
    fields: [invoices.clientId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdById],
    references: [users.id],
  }),
  items: many(invoiceItems),
  packingList: one(packingLists),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  motorcycleType: one(motorcycleTypes, {
    fields: [invoiceItems.motorcycleTypeId],
    references: [motorcycleTypes.id],
  }),
  accessory: one(accessories, {
    fields: [invoiceItems.accessoryId],
    references: [accessories.id],
  }),
}));

export const packingListsRelations = relations(
  packingLists,
  ({ one, many }) => ({
    invoice: one(invoices, {
      fields: [packingLists.invoiceId],
      references: [invoices.id],
    }),
    items: many(packingListItems),
  }),
);

export const packingListItemsRelations = relations(
  packingListItems,
  ({ one }) => ({
    packingList: one(packingLists, {
      fields: [packingListItems.packingListId],
      references: [packingLists.id],
    }),
    motorcycleType: one(motorcycleTypes, {
      fields: [packingListItems.motorcycleTypeId],
      references: [motorcycleTypes.id],
    }),
    accessory: one(accessories, {
      fields: [packingListItems.accessoryId],
      references: [accessories.id],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  recordedBy: one(users, {
    fields: [payments.recordedById],
    references: [users.id],
  }),
}));

export const warehouseTransfersRelations = relations(
  warehouseTransfers,
  ({ one, many }) => ({
    fromBranch: one(branches, {
      fields: [warehouseTransfers.fromBranchId],
      references: [branches.id],
      relationName: "transferFrom",
    }),
    toBranch: one(branches, {
      fields: [warehouseTransfers.toBranchId],
      references: [branches.id],
      relationName: "transferTo",
    }),
    createdBy: one(users, {
      fields: [warehouseTransfers.createdById],
      references: [users.id],
    }),
    motorcycles: many(warehouseTransferMotorcycles),
  }),
);

export const warehouseTransferMotorcyclesRelations = relations(
  warehouseTransferMotorcycles,
  ({ one }) => ({
    transfer: one(warehouseTransfers, {
      fields: [warehouseTransferMotorcycles.transferId],
      references: [warehouseTransfers.id],
    }),
    motorcycle: one(motorcycles, {
      fields: [warehouseTransferMotorcycles.motorcycleId],
      references: [motorcycles.id],
    }),
  }),
);
