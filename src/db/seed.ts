import { db } from "./index";
import { branches, users } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Branches ────────────────────────────────────────────────────────────────
  console.log("→ Inserting branches...");
  const insertedBranches = await db
    .insert(branches)
    .values([
      { name: "Jakarta", code: "JKT", address: "Jakarta, Indonesia", phone: "021-1234567" },
      { name: "Surabaya", code: "SBY", address: "Surabaya, Indonesia", phone: "031-1234567" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`   ✓ ${insertedBranches.length} branch(es) inserted`);

  // Fetch branch IDs (in case they already existed and onConflictDoNothing skipped insert)
  const allBranches = await db.select().from(branches);
  const jakarta = allBranches.find((b) => b.code === "JKT")!;
  const surabaya = allBranches.find((b) => b.code === "SBY")!;

  // ─── Users ────────────────────────────────────────────────────────────────────
  console.log("→ Inserting users...");

  const seedUsers = [
    {
      name: "Super Admin",
      email: "superadmin@cbr.com",
      password: "password123",
      role: "super_admin" as const,
      branchId: null,
    },
    {
      name: "Admin Export",
      email: "adminexport@cbr.com",
      password: "password123",
      role: "admin_export" as const,
      branchId: jakarta.id,
    },
    {
      name: "Admin Warehouse",
      email: "adminwarehouse@cbr.com",
      password: "password123",
      role: "admin_warehouse" as const,
      branchId: surabaya.id,
    },
    {
      name: "Finance",
      email: "finance@cbr.com",
      password: "password123",
      role: "finance" as const,
      branchId: jakarta.id,
    },
  ];

  let insertedCount = 0;
  for (const u of seedUsers) {
    const passwordHash = await Bun.password.hash(u.password);
    const result = await db
      .insert(users)
      .values({ name: u.name, email: u.email, passwordHash, role: u.role, branchId: u.branchId })
      .onConflictDoNothing()
      .returning();
    if (result.length > 0) insertedCount++;
  }

  console.log(`   ✓ ${insertedCount} user(s) inserted`);

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete! Test accounts:");
  console.log("   Role              | Email                      | Password");
  console.log("   ──────────────────┼────────────────────────────┼─────────────");
  console.log("   super_admin       | superadmin@cbr.com         | password123");
  console.log("   admin_export      | adminexport@cbr.com        | password123");
  console.log("   admin_warehouse   | adminwarehouse@cbr.com     | password123");
  console.log("   finance           | finance@cbr.com            | password123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
