CREATE TYPE "public"."report_reason" AS ENUM('damaged', 'wrong_color_model', 'mismatch');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_item_status" AS ENUM('checked', 'reported', 'done', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."travel_permit_status" ADD VALUE 'validated' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."travel_permit_status" ADD VALUE 'sent' BEFORE 'completed';--> statement-breakpoint
CREATE TABLE "travel_permit_item_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_permit_item_id" integer NOT NULL,
	"reason" "report_reason" NOT NULL,
	"quantity_affected" integer NOT NULL,
	"description" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "travel_permit_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"travel_permit_id" integer NOT NULL,
	"motorcycle_type_id" integer NOT NULL,
	"color" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"status" "travel_permit_item_status" DEFAULT 'checked' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "travel_permits" ADD COLUMN "sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD COLUMN "sent_by_id" integer;--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ADD CONSTRAINT "travel_permit_item_reports_travel_permit_item_id_travel_permit_items_id_fk" FOREIGN KEY ("travel_permit_item_id") REFERENCES "public"."travel_permit_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_item_reports" ADD CONSTRAINT "travel_permit_item_reports_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD CONSTRAINT "travel_permit_items_travel_permit_id_travel_permits_id_fk" FOREIGN KEY ("travel_permit_id") REFERENCES "public"."travel_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD CONSTRAINT "travel_permit_items_motorcycle_type_id_motorcycle_types_id_fk" FOREIGN KEY ("motorcycle_type_id") REFERENCES "public"."motorcycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_sent_by_id_users_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;