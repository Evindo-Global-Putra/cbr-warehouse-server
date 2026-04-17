CREATE TYPE "public"."export_order_status" AS ENUM('pending', 'confirmed', 'in_progress', 'loading', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."loading_form_status" AS ENUM('draft', 'confirmed', 'validated');--> statement-breakpoint
CREATE TYPE "public"."motorcycle_status" AS ENUM('on_site', 'loading', 'exported', 'transferred');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'cash', 'check', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('damaged', 'wrong_color_model', 'mismatch');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'in_transit', 'arrived', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'in_transit', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_item_status" AS ENUM('checked', 'reported', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_status" AS ENUM('pending', 'received', 'validated', 'sent', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin_export', 'admin_warehouse', 'finance');--> statement-breakpoint
CREATE TYPE "public"."warehouse_entry_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "accessories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"sku" varchar(50) NOT NULL,
	"category" varchar(100),
	"description" text,
	"quantity_in_stock" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(12, 2),
	"unit_price" numeric(12, 2),
	"gross_weight_per_unit" numeric(8, 2),
	"net_weight_per_unit" numeric(8, 2),
	"branch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accessories_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_order_id" uuid NOT NULL,
	"motorcycle_type_id" uuid,
	"accessory_id" uuid,
	"quantity_requested" integer NOT NULL,
	"quantity_assigned" integer DEFAULT 0 NOT NULL,
	"unit_price" numeric(12, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "export_order_motorcycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_order_id" uuid NOT NULL,
	"motorcycle_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"client_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"status" "export_order_status" DEFAULT 'pending' NOT NULL,
	"requested_units" integer NOT NULL,
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "export_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(300) NOT NULL,
	"motorcycle_type_id" uuid,
	"accessory_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"export_order_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"vessel" varchar(200),
	"etd" timestamp,
	"from_port" varchar(200),
	"to_port" varchar(200),
	"shipping_term" varchar(50),
	"country_of_origin" varchar(100) DEFAULT 'Indonesia',
	"subtotal" numeric(14, 2) NOT NULL,
	"freight_amount" numeric(14, 2) DEFAULT '0',
	"tax_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" timestamp,
	"issued_at" timestamp,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "loading_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_order_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"truck_police_number" varchar(20),
	"status" "loading_form_status" DEFAULT 'draft' NOT NULL,
	"validated_by_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motorcycle_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"variant" varchar(100),
	"engine_cc" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motorcycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"no_induk" varchar(50) NOT NULL,
	"type_id" uuid NOT NULL,
	"color" varchar(50) NOT NULL,
	"frame_number" varchar(50) NOT NULL,
	"engine_number" varchar(50) NOT NULL,
	"barcode" varchar(100),
	"status" "motorcycle_status" DEFAULT 'on_site' NOT NULL,
	"branch_id" uuid NOT NULL,
	"entry_id" uuid,
	"travel_permit_item_id" uuid,
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
CREATE TABLE "packing_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"packing_list_id" uuid NOT NULL,
	"description" varchar(300) NOT NULL,
	"motorcycle_type_id" uuid,
	"accessory_id" uuid,
	"quantity" integer NOT NULL,
	"gross_weight" numeric(10, 2) NOT NULL,
	"net_weight" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packing_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"shipping_term" varchar(50),
	"container_number" varchar(100),
	"shipping_marks" text,
	"total_quantity" integer DEFAULT 0 NOT NULL,
	"total_gross_weight" numeric(10, 2),
	"total_net_weight" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "packing_lists_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference_number" varchar(100),
	"payment_date" timestamp NOT NULL,
	"notes" text,
	"recorded_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loading_form_id" uuid NOT NULL,
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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
CREATE TABLE "travel_permit_item_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"travel_permit_item_id" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"description" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_permit_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"travel_permit_id" uuid NOT NULL,
	"motorcycle_type_id" uuid NOT NULL,
	"nospk" varchar(50),
	"color" varchar(50) NOT NULL,
	"frame_number" varchar(50) NOT NULL,
	"engine_number" varchar(50) NOT NULL,
	"year" integer,
	"destination_code" varchar(20),
	"status" "travel_permit_item_status" DEFAULT 'checked' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_permits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit_number" varchar(50) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"truck_police_number" varchar(20),
	"driver_name" varchar(100),
	"total_units" integer NOT NULL,
	"status" "travel_permit_status" DEFAULT 'pending' NOT NULL,
	"issued_date" timestamp,
	"received_date" timestamp,
	"sent_at" timestamp,
	"sent_by_id" uuid,
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "travel_permits_permit_number_unique" UNIQUE("permit_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"branch_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "warehouse_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"travel_permit_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"total_units_expected" integer NOT NULL,
	"total_units_scanned" integer DEFAULT 0 NOT NULL,
	"status" "warehouse_entry_status" DEFAULT 'in_progress' NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfer_motorcycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"motorcycle_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_branch_id" uuid NOT NULL,
	"to_branch_id" uuid NOT NULL,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_export_order_id_export_orders_id_fk" FOREIGN KEY ("export_order_id") REFERENCES "public"."export_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ADD CONSTRAINT "export_order_motorcycles_export_order_id_export_orders_id_fk" FOREIGN KEY ("export_order_id") REFERENCES "public"."export_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ADD CONSTRAINT "export_order_motorcycles_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_client_id_companies_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_orders" ADD CONSTRAINT "export_orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_travel_permit_item_id_travel_permit_items_id_fk" FOREIGN KEY ("travel_permit_item_id") REFERENCES "public"."travel_permit_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_packing_list_id_packing_lists_id_fk" FOREIGN KEY ("packing_list_id") REFERENCES "public"."packing_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_lists" ADD CONSTRAINT "packing_lists_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_loading_form_id_loading_forms_id_fk" FOREIGN KEY ("loading_form_id") REFERENCES "public"."loading_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ADD CONSTRAINT "travel_permit_item_reports_travel_permit_item_id_travel_permit_items_id_fk" FOREIGN KEY ("travel_permit_item_id") REFERENCES "public"."travel_permit_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ADD CONSTRAINT "travel_permit_item_reports_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD CONSTRAINT "travel_permit_items_travel_permit_id_travel_permits_id_fk" FOREIGN KEY ("travel_permit_id") REFERENCES "public"."travel_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD CONSTRAINT "travel_permit_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_sent_by_id_users_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ADD CONSTRAINT "warehouse_entries_travel_permit_id_travel_permits_id_fk" FOREIGN KEY ("travel_permit_id") REFERENCES "public"."travel_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ADD CONSTRAINT "warehouse_entries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ADD CONSTRAINT "warehouse_entries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ADD CONSTRAINT "warehouse_transfer_motorcycles_transfer_id_warehouse_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."warehouse_transfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ADD CONSTRAINT "warehouse_transfer_motorcycles_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_from_branch_id_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_to_branch_id_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ADD CONSTRAINT "warehouse_transfers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;