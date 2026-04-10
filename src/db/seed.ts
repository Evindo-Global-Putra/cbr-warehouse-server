import { db } from "./index";
import {
  branches,
  users,
  suppliers,
  companies,
  motorcycleTypes,
  motorcycles,
  accessories,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Branches ────────────────────────────────────────────────────────────────
  console.log("→ Inserting branches...");
  await db
    .insert(branches)
    .values([
      { name: "Jakarta", code: "JKT", address: "Jakarta, Indonesia", phone: "021-1234567" },
      { name: "Surabaya", code: "SBY", address: "Surabaya, Indonesia", phone: "031-1234567" },
    ])
    .onConflictDoNothing();

  const allBranches = await db.select().from(branches);
  const jakarta = allBranches.find((b) => b.code === "JKT")!;
  const surabaya = allBranches.find((b) => b.code === "SBY")!;
  console.log(`   ✓ ${allBranches.length} branch(es) ready`);

  // ─── Users ────────────────────────────────────────────────────────────────────
  console.log("→ Inserting users...");
  const seedUsers = [
    { name: "Super Admin",       email: "superadmin@cbr.com",      password: "password123", role: "super_admin"      as const, branchId: null        },
    { name: "Admin Export",      email: "adminexport@cbr.com",     password: "password123", role: "admin_export"     as const, branchId: jakarta.id  },
    { name: "Admin Warehouse",   email: "adminwarehouse@cbr.com",  password: "password123", role: "admin_warehouse"  as const, branchId: surabaya.id },
    { name: "Finance",           email: "finance@cbr.com",         password: "password123", role: "finance"          as const, branchId: jakarta.id  },
  ];

  let userCount = 0;
  for (const u of seedUsers) {
    const passwordHash = await Bun.password.hash(u.password);
    const result = await db
      .insert(users)
      .values({ name: u.name, email: u.email, passwordHash, role: u.role, branchId: u.branchId })
      .onConflictDoNothing()
      .returning();
    if (result.length > 0) userCount++;
  }
  console.log(`   ✓ ${userCount} user(s) inserted`);

  // ─── Suppliers ────────────────────────────────────────────────────────────────
  console.log("→ Inserting suppliers...");
  await db
    .insert(suppliers)
    .values([
      {
        name: "PT Yamaha Indonesia Motor Manufacturing",
        country: "Indonesia",
        contactName: "Budi Santoso",
        phone: "021-8888-1111",
        email: "supply@yamaha-indonesia.co.id",
        address: "Jl. Dr. KRT. Radjiman Widyodiningrat No.8, Pulogadung, Jakarta Timur",
        notes: "Main Yamaha distributor for Java region",
      },
      {
        name: "PT Astra Honda Motor",
        country: "Indonesia",
        contactName: "Dewi Rahayu",
        phone: "021-5558-2222",
        email: "supply@ahm.co.id",
        address: "Jl. Laksda Yos Sudarso, Sunter Jaya, Jakarta Utara",
        notes: "Honda official distributor",
      },
      {
        name: "PT Kawasaki Motor Indonesia",
        country: "Indonesia",
        contactName: "Riko Prasetyo",
        phone: "021-7771-3333",
        email: "supply@kawasaki.co.id",
        address: "Jl. Perintis Kemerdekaan No.1, Pulogadung, Jakarta Timur",
      },
      {
        name: "PT Suzuki Indomobil Motor",
        country: "Indonesia",
        contactName: "Sari Wulandari",
        phone: "021-3334-4444",
        email: "supply@suzuki-indonesia.co.id",
        address: "Jl. P. Diponegoro No.38, Gambir, Jakarta Pusat",
      },
    ])
    .onConflictDoNothing();

  const allSuppliers = await db.select().from(suppliers);
  console.log(`   ✓ ${allSuppliers.length} supplier(s) ready`);

  // ─── Companies (B2B clients) ──────────────────────────────────────────────────
  console.log("→ Inserting companies...");
  await db
    .insert(companies)
    .values([
      {
        name: "Al-Nasser Trading LLC",
        country: "Lebanon",
        contactName: "Ahmad Al-Nasser",
        phone: "+961-1-234567",
        email: "import@alnasser-trading.lb",
        address: "Beirut Central District, Beirut, Lebanon",
        notes: "Regular client — 100–150 units per order, Yamaha preferred",
      },
      {
        name: "Mekong Motors Co., Ltd.",
        country: "Cambodia",
        contactName: "Sokha Chea",
        phone: "+855-23-456789",
        email: "orders@mekongmotors.com.kh",
        address: "No. 123, Preah Monivong Blvd, Phnom Penh, Cambodia",
        notes: "Focuses on Honda and Yamaha scooters",
      },
      {
        name: "East Africa Moto Distributors",
        country: "Kenya",
        contactName: "James Omondi",
        phone: "+254-20-123456",
        email: "james@eamd.co.ke",
        address: "Industrial Area, Mombasa Road, Nairobi, Kenya",
      },
      {
        name: "Gulf Bikes Trading WLL",
        country: "Bahrain",
        contactName: "Khalid Al-Mansoori",
        phone: "+973-17-123456",
        email: "khalid@gulfbikes.bh",
        address: "Manama Souq Area, Manama, Bahrain",
        notes: "Prefers premium models — NMAX, R25, XSR",
      },
    ])
    .onConflictDoNothing();

  const allCompanies = await db.select().from(companies);
  console.log(`   ✓ ${allCompanies.length} compan(ies) ready`);

  // ─── Motorcycle Types ─────────────────────────────────────────────────────────
  console.log("→ Inserting motorcycle types...");
  await db
    .insert(motorcycleTypes)
    .values([
      { brand: "Yamaha", model: "NMAX NEO",    variant: "KEY",        engineCc: 155 },
      { brand: "Yamaha", model: "NMAX NEO",    variant: "KEYLESS",    engineCc: 155 },
      { brand: "Yamaha", model: "Aerox Alpha", variant: "STANDARD",   engineCc: 155 },
      { brand: "Yamaha", model: "Aerox Alpha", variant: "CYBERCITY",  engineCc: 155 },
      { brand: "Yamaha", model: "Lexi",        variant: "STANDARD",   engineCc: 125 },
      { brand: "Yamaha", model: "Gear Ultima", variant: null,         engineCc: 125 },
      { brand: "Yamaha", model: "XSR 155",     variant: null,         engineCc: 155 },
      { brand: "Yamaha", model: "R25",         variant: null,         engineCc: 249 },
      { brand: "Honda",  model: "Beat Street", variant: "CBS",        engineCc: 110 },
      { brand: "Honda",  model: "PCX 160",     variant: null,         engineCc: 160 },
    ])
    .onConflictDoNothing();

  const allTypes = await db.select().from(motorcycleTypes);
  console.log(`   ✓ ${allTypes.length} motorcycle type(s) ready`);

  // ─── Accessories ──────────────────────────────────────────────────────────────
  console.log("→ Inserting accessories...");
  await db
    .insert(accessories)
    .values([
      {
        name: "Helmet Full-Face Standard",
        sku: "ACC-HLM-001",
        category: "Helmet",
        description: "Standard full-face helmet, bundled 1 per motorcycle",
        quantityInStock: 200,
        unitCost: "85000",
        unitPrice: "10.00",
        grossWeightPerUnit: "2.00",
        netWeightPerUnit: "1.80",
        branchId: jakarta.id,
      },
      {
        name: "Helmet Half-Face Standard",
        sku: "ACC-HLM-002",
        category: "Helmet",
        description: "Half-face helmet variant",
        quantityInStock: 100,
        unitCost: "65000",
        unitPrice: "8.00",
        grossWeightPerUnit: "1.50",
        netWeightPerUnit: "1.30",
        branchId: jakarta.id,
      },
    ])
    .onConflictDoNothing();

  const allAccessories = await db.select().from(accessories);
  console.log(`   ✓ ${allAccessories.length} accessor(ies) ready`);

  // ─── Motorcycles (sample units in stock) ─────────────────────────────────────
  console.log("→ Inserting motorcycles...");
  const nmax_key = allTypes.find((t) => t.model === "NMAX NEO" && t.variant === "KEY")!;
  const nmax_keyless = allTypes.find((t) => t.model === "NMAX NEO" && t.variant === "KEYLESS")!;
  const aerox_std = allTypes.find((t) => t.model === "Aerox Alpha" && t.variant === "STANDARD")!;
  const xsr155 = allTypes.find((t) => t.model === "XSR 155")!;

  await db
    .insert(motorcycles)
    .values([
      {
        noInduk: "JKT-2025-0001",
        typeId: nmax_key.id,
        color: "Matte Black",
        frameNumber: "MH3SG3280PK100001",
        engineNumber: "G3E2100001",
        barcode: "CBR-JKT-0001",
        status: "on_site",
        branchId: jakarta.id,
        entryDate: new Date("2025-04-01"),
      },
      {
        noInduk: "JKT-2025-0002",
        typeId: nmax_keyless.id,
        color: "Ice Blue",
        frameNumber: "MH3SG3280PK100002",
        engineNumber: "G3E2100002",
        barcode: "CBR-JKT-0002",
        status: "on_site",
        branchId: jakarta.id,
        entryDate: new Date("2025-04-01"),
      },
      {
        noInduk: "JKT-2025-0003",
        typeId: aerox_std.id,
        color: "Pearl White",
        frameNumber: "MH3SJ4280PK100003",
        engineNumber: "S4E2100003",
        barcode: "CBR-JKT-0003",
        status: "on_site",
        branchId: jakarta.id,
        entryDate: new Date("2025-04-02"),
      },
      {
        noInduk: "SBY-2025-0001",
        typeId: xsr155.id,
        color: "Racing Blue",
        frameNumber: "MH3RD3290PK200001",
        engineNumber: "D3E2200001",
        barcode: "CBR-SBY-0001",
        status: "on_site",
        branchId: surabaya.id,
        entryDate: new Date("2025-04-03"),
      },
    ])
    .onConflictDoNothing();

  const allMotorcycles = await db.select().from(motorcycles);
  console.log(`   ✓ ${allMotorcycles.length} motorcycle(s) ready`);

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log("\n   Test accounts:");
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
