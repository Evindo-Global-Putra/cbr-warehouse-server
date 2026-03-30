CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" varchar(300) NOT NULL,
	"motorcycle_type_id" integer,
	"accessory_id" integer,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packing_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"packing_list_id" integer NOT NULL,
	"description" varchar(300) NOT NULL,
	"motorcycle_type_id" integer,
	"accessory_id" integer,
	"quantity" integer NOT NULL,
	"gross_weight" numeric(10, 2) NOT NULL,
	"net_weight" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packing_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"shipping_term" varchar(50),
	"total_quantity" integer DEFAULT 0 NOT NULL,
	"total_gross_weight" numeric(10, 2),
	"total_net_weight" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "packing_lists_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
ALTER TABLE "export_order_items" ALTER COLUMN "motorcycle_type_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accessories" ADD COLUMN "gross_weight_per_unit" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "accessories" ADD COLUMN "net_weight_per_unit" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "export_order_items" ADD COLUMN "accessory_id" integer;--> statement-breakpoint
ALTER TABLE "export_order_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "vessel" varchar(200);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "etd" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "from_port" varchar(200);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "to_port" varchar(200);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "shipping_term" varchar(50);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "country_of_origin" varchar(100) DEFAULT 'Indonesia';--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "freight_amount" numeric(14, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "motorcycle_types" ADD COLUMN "variant" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_packing_list_id_packing_lists_id_fk" FOREIGN KEY ("packing_list_id") REFERENCES "public"."packing_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packing_lists" ADD CONSTRAINT "packing_lists_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_order_items" ADD CONSTRAINT "export_order_items_accessory_id_accessories_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessories"("id") ON DELETE no action ON UPDATE no action;