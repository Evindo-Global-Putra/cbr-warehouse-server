ALTER TABLE "accessories" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "accessories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "accessories" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "export_order_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_order_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "export_order_items" ALTER COLUMN "export_order_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_order_items" ALTER COLUMN "motorcycle_type_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_order_items" ALTER COLUMN "accessory_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ALTER COLUMN "export_order_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_order_motorcycles" ALTER COLUMN "motorcycle_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_orders" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_orders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "export_orders" ALTER COLUMN "client_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_orders" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "export_orders" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "motorcycle_type_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "accessory_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "export_order_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "client_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "loading_forms" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "loading_forms" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "loading_forms" ALTER COLUMN "export_order_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "loading_forms" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "loading_forms" ALTER COLUMN "validated_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "loading_forms" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "motorcycle_types" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "motorcycle_types" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "motorcycles" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "motorcycles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "motorcycles" ALTER COLUMN "type_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "motorcycles" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "motorcycles" ALTER COLUMN "entry_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packing_list_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packing_list_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "packing_list_items" ALTER COLUMN "packing_list_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packing_list_items" ALTER COLUMN "motorcycle_type_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packing_list_items" ALTER COLUMN "accessory_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packing_lists" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packing_lists" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "packing_lists" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "invoice_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "recorded_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "shipments" ALTER COLUMN "loading_form_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ALTER COLUMN "travel_permit_item_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "travel_permit_items" ALTER COLUMN "travel_permit_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ALTER COLUMN "motorcycle_type_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permits" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permits" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "travel_permits" ALTER COLUMN "supplier_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permits" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permits" ALTER COLUMN "sent_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "travel_permits" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "warehouse_entries" ALTER COLUMN "travel_permit_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_entries" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ALTER COLUMN "transfer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_transfer_motorcycles" ALTER COLUMN "motorcycle_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ALTER COLUMN "from_branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ALTER COLUMN "to_branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "warehouse_transfers" ALTER COLUMN "created_by_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "motorcycles" ADD COLUMN "travel_permit_item_id" uuid;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD COLUMN "nospk" varchar(50);--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD COLUMN "frame_number" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD COLUMN "engine_number" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD COLUMN "destination_code" varchar(20);--> statement-breakpoint
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_travel_permit_item_id_travel_permit_items_id_fk" FOREIGN KEY ("travel_permit_item_id") REFERENCES "public"."travel_permit_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" DROP COLUMN "quantity_affected";--> statement-breakpoint
ALTER TABLE "travel_permit_items" DROP COLUMN "quantity";