CREATE TYPE "public"."export_order_status" AS ENUM('pending', 'confirmed', 'in_progress', 'loading', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."loading_form_status" AS ENUM('draft', 'confirmed', 'validated');--> statement-breakpoint
CREATE TYPE "public"."motorcycle_status" AS ENUM('on_site', 'loading', 'exported', 'transferred');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'cash', 'check', 'other');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'in_transit', 'arrived', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'in_transit', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_status" AS ENUM('pending', 'received', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin_export', 'admin_warehouse', 'finance');--> statement-breakpoint
CREATE TYPE "public"."warehouse_entry_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "accessories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"sku" varchar(50) NOT NULL,
	"category" varchar(100),
	"description" text,
	"quantity_in_stock" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(12, 2),
	"unit_price" numeric(12, 2),
	"branch_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accessories_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"address" text,
	"phone" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "branches_name_unique" UNIQUE("name"),
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"country" varchar(100) NOT NULL,
	"contact_name" varchar(100),
	"phone" varchar(30),
	"email" text,
	"address" text,
	"npwp" varchar(30),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"export_order_id" integer NOT NULL,
	"motorcycle_type_id" integer NOT NULL,
	"quantity_requested" integer NOT NULL,
	"quantity_assigned" integer DEFAULT 0 NOT NULL,
	"unit_price" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "export_order_motorcycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"export_order_id" integer NOT NULL,
	"motorcycle_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"client_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"status" "export_order_status" DEFAULT 'pending' NOT NULL,
	"requested_units" integer NOT NULL,
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "export_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"export_order_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"subtotal" numeric(14, 2) NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" timestamp,
	"issued_at" timestamp,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "loading_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"export_order_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"truck_police_number" varchar(20),
	"status" "loading_form_status" DEFAULT 'draft' NOT NULL,
	"validated_by_id" integer,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motorcycle_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"engine_cc" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motorcycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"no_induk" varchar(50) NOT NULL,
	"type_id" integer NOT NULL,
	"color" varchar(50) NOT NULL,
	"frame_number" varchar(50) NOT NULL,
	"engine_number" varchar(50) NOT NULL,
	"barcode" varchar(100),
	"status" "motorcycle_status" DEFAULT 'on_site' NOT NULL,
	"branch_id" integer NOT NULL,
	"entry_id" integer,
	"front_photo_url" text,
	"frame_photo_url" text,
	"engine_photo_url" text,
	"entry_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "motorcycles_no_induk_unique" UNIQUE("no_induk"),
	CONSTRAINT "motorcycles_frame_number_unique" UNIQUE("frame_number"),
	CONSTRAINT "motorcycles_engine_number_unique" UNIQUE("engine_number"),
	CONSTRAINT "motorcycles_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference_number" varchar(100),
	"payment_date" timestamp NOT NULL,
	"notes" text,
	"recorded_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"loading_form_id" integer NOT NULL,
	"tracking_number" varchar(100),
	"carrier" varchar(100),
	"destination_country" varchar(100),
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"shipped_at" timestamp,
	"estimated_arrival" timestamp,
	"actual_arrival" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"country" varchar(100),
	"contact_name" varchar(100),
	"phone" varchar(30),
	"email" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_permits" (
	"id" serial PRIMARY KEY NOT NULL,
	"permit_number" varchar(50) NOT NULL,
	"supplier_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"truck_police_number" varchar(20),
	"driver_name" varchar(100),
	"total_units" integer NOT NULL,
	"status" "travel_permit_status" DEFAULT 'pending' NOT NULL,
	"issued_date" timestamp,
	"received_date" timestamp,
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "travel_permits_permit_number_unique" UNIQUE("permit_number")
);
--> statement-breakpoint
CREATE TABLE "warehouse_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_permit_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"total_units_expected" integer NOT NULL,
	"total_units_scanned" integer DEFAULT 0 NOT NULL,
	"status" "warehouse_entry_status" DEFAULT 'in_progress' NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfer_motorcycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"transfer_id" integer NOT NULL,
	"motorcycle_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_branch_id" integer NOT NULL,
	"to_branch_id" integer NOT NULL,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_export_order_id_export_orders_id_fk" FOREIGN KEY ("export_order_id") REFERENCES "public"."export_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ADD CONSTRAINT "export_order_motorcycles_export_order_id_export_orders_id_fk" FOREIGN KEY ("export_order_id") REFERENCES "public"."export_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ADD CONSTRAINT "export_order_motorcycles_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_client_id_companies_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_export_order_id_export_orders_id_fk" FOREIGN KEY ("export_order_id") REFERENCES "public"."export_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_companies_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loading_forms" ADD CONSTRAINT "loading_forms_export_order_id_export_orders_id_fk" FOREIGN KEY ("export_order_id") REFERENCES "public"."export_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loading_forms" ADD CONSTRAINT "loading_forms_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loading_forms" ADD CONSTRAINT "loading_forms_validated_by_id_users_id_fk" FOREIGN KEY ("validated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loading_forms" ADD CONSTRAINT "loading_forms_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_type_id_motorcycle_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_entry_id_warehouse_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."warehouse_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_loading_form_id_loading_forms_id_fk" FOREIGN KEY ("loading_form_id") REFERENCES "public"."loading_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ADD CONSTRAINT "warehouse_entries_travel_permit_id_travel_permits_id_fk" FOREIGN KEY ("travel_permit_id") REFERENCES "public"."travel_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ADD CONSTRAINT "warehouse_entries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ADD CONSTRAINT "warehouse_entries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ADD CONSTRAINT "warehouse_transfer_motorcycles_transfer_id_warehouse_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."warehouse_transfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ADD CONSTRAINT "warehouse_transfer_motorcycles_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_from_branch_id_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_to_branch_id_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;