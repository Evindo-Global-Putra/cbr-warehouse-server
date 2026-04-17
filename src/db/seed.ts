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
      {
        name: "Jakarta",
        code: "JKT",
        address: "Arcade Business Center Lt.6 Unit 6-03, Jl. Kapuk Muara Penjaringan, Jakarta Utara, DKI Jakarta 14470",
        phone: "021-5551234",
      },
      {
        name: "Surabaya",
        code: "SBY",
        address: "Jl. Raya Margomulyo No.99, Tandes, Surabaya, Jawa Timur 60186",
        phone: "031-7774567",
      },
      {
        name: "Bandung",
        code: "BDG",
        address: "Jl. Soekarno-Hatta No.456, Babakan Ciparay, Bandung, Jawa Barat 40223",
        phone: "022-6031234",
      },
      {
        name: "Medan",
        code: "MDN",
        address: "Jl. Gatot Subroto No.88, Medan Petisah, Medan, Sumatera Utara 20112",
        phone: "061-8821234",
      },
    ])
    .onConflictDoNothing();

  const allBranches = await db.select().from(branches);
  const jakarta = allBranches.find((b) => b.code === "JKT")!;
  const surabaya = allBranches.find((b) => b.code === "SBY")!;
  const bandung = allBranches.find((b) => b.code === "BDG")!;
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
        address: "Jl. Dr. KRT. Radjiman Widyodiningrat No.8, Pulogadung, Jakarta Timur 13930",
        notes: "Main Yamaha distributor for Java region",
      },
      {
        name: "PT Astra Honda Motor",
        country: "Indonesia",
        contactName: "Dewi Rahayu",
        phone: "021-6519-0001",
        email: "supply@ahm.co.id",
        address: "Jl. Laksda Yos Sudarso Kav.23, Sunter Jaya, Jakarta Utara 14350",
        notes: "Honda official distributor — primary supplier for Beat, PCX, and Vario series",
      },
      {
        name: "PT Kawasaki Motor Indonesia",
        country: "Indonesia",
        contactName: "Riko Prasetyo",
        phone: "021-4603-3333",
        email: "supply@kawasaki.co.id",
        address: "Jl. Perintis Kemerdekaan No.1, Pulogadung, Jakarta Timur 13260",
        notes: "Kawasaki distributor — Z series and KLX off-road",
      },
      {
        name: "PT Suzuki Indomobil Motor",
        country: "Indonesia",
        contactName: "Sari Wulandari",
        phone: "021-3141-4444",
        email: "supply@suzuki-indonesia.co.id",
        address: "Jl. P. Diponegoro No.38, Gambir, Jakarta Pusat 10310",
        notes: "Suzuki distributor — Address and Burgman series",
      },
      {
        name: "PT TVS Motor Company Indonesia",
        country: "Indonesia",
        contactName: "Hendra Wijaya",
        phone: "021-7755-5555",
        email: "supply@tvs-indonesia.co.id",
        address: "Jl. Industri Raya No.65, Cikupa, Tangerang, Banten 15710",
        notes: "TVS distributor — Ronin and Apache series",
      },
      {
        name: "PT KTM Indonesia",
        country: "Indonesia",
        contactName: "Agus Firmansyah",
        phone: "021-8821-6666",
        email: "supply@ktm-indonesia.co.id",
        address: "Jl. Raya Bekasi KM.27, Pondok Ungu, Bekasi, Jawa Barat 17133",
        notes: "KTM distributor — Duke and RC sport series",
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
        address: "Gefinor Center, Bloc B, Hamra Street, Beirut, Lebanon",
        npwp: null,
        notes: "Regular client — 100–150 units per order, Yamaha preferred",
      },
      {
        name: "Mekong Motors Co., Ltd.",
        country: "Cambodia",
        contactName: "Sokha Chea",
        phone: "+855-23-456789",
        email: "orders@mekongmotors.com.kh",
        address: "No. 123, Preah Monivong Blvd, Chamkarmon, Phnom Penh 120101, Cambodia",
        npwp: null,
        notes: "Focuses on Honda and Yamaha scooters; ships via Sihanoukville port",
      },
      {
        name: "East Africa Moto Distributors",
        country: "Kenya",
        contactName: "James Omondi",
        phone: "+254-20-123456",
        email: "james@eamd.co.ke",
        address: "Industrial Area, Mombasa Road, Nairobi 00200, Kenya",
        npwp: null,
        notes: "Bulk orders of commuter bikes; 80–120 units per shipment",
      },
      {
        name: "Gulf Bikes Trading WLL",
        country: "Bahrain",
        contactName: "Khalid Al-Mansoori",
        phone: "+973-17-123456",
        email: "khalid@gulfbikes.bh",
        address: "Shop 14, Block 304, Road 4501, Manama 345, Bahrain",
        npwp: null,
        notes: "Prefers premium models — NMAX, R25, XSR; payment via bank transfer",
      },
      {
        name: "Mindanao Cycle Traders Corp.",
        country: "Philippines",
        contactName: "Maria Santos",
        phone: "+63-82-234-5678",
        email: "imports@mindanao-cycles.ph",
        address: "JP Laurel Ave, Bajada, Davao City, Davao del Sur 8000, Philippines",
        npwp: null,
        notes: "Focuses on Honda Beat and Yamaha Gear; medium-volume orders",
      },
      {
        name: "Nile Delta Auto & Moto",
        country: "Egypt",
        contactName: "Hassan Ibrahim",
        phone: "+20-2-2345-6789",
        email: "h.ibrahim@niledelta-moto.eg",
        address: "35 El-Gomhuria Street, Cairo Governorate, Cairo 11511, Egypt",
        npwp: null,
        notes: "New client — first shipment Q2 2025; Kawasaki Z series and Honda PCX",
      },
      {
        name: "Saigon Moto Import JSC",
        country: "Vietnam",
        contactName: "Nguyen Van Duc",
        phone: "+84-28-3823-4567",
        email: "import@saigonmoto.vn",
        address: "12 Nguyen Hue Boulevard, District 1, Ho Chi Minh City 700000, Vietnam",
        npwp: null,
        notes: "High-volume client — 150+ units; Yamaha and Honda mix",
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
      // Yamaha — Scooter
      { brand: "Yamaha", model: "NMAX NEO",    variant: "KEY",              engineCc: 155 },
      { brand: "Yamaha", model: "NMAX NEO",    variant: "KEYLESS",          engineCc: 155 },
      { brand: "Yamaha", model: "Aerox Alpha", variant: "STANDARD",         engineCc: 155 },
      { brand: "Yamaha", model: "Aerox Alpha", variant: "CYBERCITY",        engineCc: 155 },
      { brand: "Yamaha", model: "Lexi",        variant: "STANDARD",         engineCc: 125 },
      { brand: "Yamaha", model: "Lexi",        variant: "S VERSION",        engineCc: 125 },
      { brand: "Yamaha", model: "Gear Ultima", variant: null,               engineCc: 125 },
      { brand: "Yamaha", model: "Fazzio",      variant: "HYBRID",           engineCc: 125 },
      { brand: "Yamaha", model: "Filano",      variant: "HYBRID",           engineCc: 125 },
      // Yamaha — Sport
      { brand: "Yamaha", model: "XSR 155",     variant: null,               engineCc: 155 },
      { brand: "Yamaha", model: "R25",         variant: null,               engineCc: 249 },
      { brand: "Yamaha", model: "MT-25",       variant: null,               engineCc: 249 },
      // Honda — Scooter
      { brand: "Honda",  model: "Beat Street", variant: "CBS",              engineCc: 110 },
      { brand: "Honda",  model: "Beat Street", variant: "CBS ISS",          engineCc: 110 },
      { brand: "Honda",  model: "Vario 160",   variant: "CBS",              engineCc: 160 },
      { brand: "Honda",  model: "Vario 160",   variant: "ABS",              engineCc: 160 },
      { brand: "Honda",  model: "PCX 160",     variant: "CBS",              engineCc: 160 },
      { brand: "Honda",  model: "PCX 160",     variant: "ABS",              engineCc: 160 },
      { brand: "Honda",  model: "ADV 160",     variant: null,               engineCc: 160 },
      // Honda — Sport
      { brand: "Honda",  model: "CBR150R",     variant: null,               engineCc: 150 },
      { brand: "Honda",  model: "CB150R",      variant: "STREETFIRE",       engineCc: 150 },
      // Kawasaki
      { brand: "Kawasaki", model: "Z125",      variant: "PRO",              engineCc: 125 },
      { brand: "Kawasaki", model: "KLX 150",   variant: "BF",               engineCc: 150 },
      { brand: "Kawasaki", model: "KLX 150",   variant: "S",                engineCc: 150 },
      { brand: "Kawasaki", model: "Ninja 250",  variant: "SL ABS",          engineCc: 250 },
      // Suzuki
      { brand: "Suzuki",   model: "Address",   variant: "FI",               engineCc: 113 },
      { brand: "Suzuki",   model: "Burgman Street", variant: "EX",          engineCc: 125 },
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
      {
        name: "Helmet Full-Face Standard",
        sku: "ACC-HLM-003",
        category: "Helmet",
        description: "Standard full-face helmet stock for Surabaya branch",
        quantityInStock: 150,
        unitCost: "85000",
        unitPrice: "10.00",
        grossWeightPerUnit: "2.00",
        netWeightPerUnit: "1.80",
        branchId: surabaya.id,
      },
      {
        name: "Helmet Half-Face Standard",
        sku: "ACC-HLM-004",
        category: "Helmet",
        description: "Half-face helmet stock for Bandung branch",
        quantityInStock: 80,
        unitCost: "65000",
        unitPrice: "8.00",
        grossWeightPerUnit: "1.50",
        netWeightPerUnit: "1.30",
        branchId: bandung.id,
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
