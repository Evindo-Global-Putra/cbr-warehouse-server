import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import { travelPermitItemReports } from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;
type TravelPermitItemReport = typeof travelPermitItemReports.$inferSelect;
type NewTravelPermitItemReport = typeof travelPermitItemReports.$inferInsert;

export class TravelPermitItemReportRepository {
  constructor(private db: DB) {}

  async findByItemId(travelPermitItemId: string): Promise<TravelPermitItemReport[]> {
    return this.db
      .select()
      .from(travelPermitItemReports)
      .where(eq(travelPermitItemReports.travelPermitItemId, travelPermitItemId));
  }

  async create(data: NewTravelPermitItemReport): Promise<TravelPermitItemReport> {
    const result = await this.db
      .insert(travelPermitItemReports)
      .values(data)
      .returning();
    return result[0];
  }
}
