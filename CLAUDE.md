# CBR Warehouse Server — Backend

> Backend service for the CBR Motorcycle Import & Export Warehouse Management System.

---

## Overview

CBR Warehouse Server is the backend API powering a **B2B motorcycle and accessories warehouse management system**. The platform manages the full lifecycle of motorcycle inventory — from supplier procurement and warehouse entry (with barcode/frame/engine scanning), through stock cataloging, to export loading and shipment tracking.

---

## Tech Stack

| Technology  | Role                |
| ----------- | ------------------- |
| Bun         | JavaScript Runtime  |
| ElysiaJS    | Web Framework       |
| Drizzle ORM | Database ORM        |
| PostgreSQL  | Relational Database |
| Docker      | Containerization    |

---

## Business Flow

### Context

This is a **B2B operation**. Clients (dealers/distributors) typically request **100–150 motorcycles** of various brands and types in a single order. The system must handle high-volume inventory tracking across multiple warehouse locations (e.g., Jakarta, Surabaya).

### Actors / Roles

| Role                | Responsibilities                                                                 |
| ------------------- | -------------------------------------------------------------------------------- |
| **Admin Export**    | Handles client requests, checks stock, contacts suppliers, creates export orders |
| **Admin Warehouse** | Manages warehouse entry, scans barcodes/frame/engine numbers, handles loading    |
| **Super Admin**     | Manages employees, companies, authorization, and general settings                |
| **Finance**         | Creates payment forms, audits payments                                           |

### Core Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST (B2B)                             │
│              "We need 120 units of various brands & types"              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
                 ┌──────────────────────┐
                 │  Admin Export checks  │
                 │    warehouse stock    │
                 └─────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         Stock Available          Stock Unavailable
              │                         │
              ▼                         ▼
   ┌────────────────────┐    ┌─────────────────────────┐
   │ Create export       │    │ Purchase from Supplier   │
   │ request immediately │    │ based on availability    │
   └────────┬───────────┘    └────────────┬────────────┘
            │                             │
            │                             ▼
            │                  ┌─────────────────────────┐
            │                  │ Supplier sends delivery  │
            │                  │ note (Surat Jalan / SJ)  │
            │                  │ and Packing List via email│
            │                  └────────────┬────────────┘
            │                               │
            │                               ▼
            │                  ┌─────────────────────────┐
            │                  │ Product arrives at       │
            │                  │ warehouse                │
            │                  └────────────┬────────────┘
            │                               │
            │                               ▼
            │                  ┌─────────────────────────────────────┐
            │                  │ WAREHOUSE ENTRY PROCESS             │
            │                  │                                     │
            │                  │ 1. Admin Warehouse verifies SJ & PL │
            │                  │ 2. Open Entry Gudang form           │
            │                  │ 3. Select Travel Permit             │
            │                  │ 4. Scan/upload front view photo     │
            │                  │ 5. Select bike type & color         │
            │                  │ 6. Scan Frame Number                │
            │                  │ 7. Scan Engine Number               │
            │                  │ 8. Confirm data & generate barcode  │
            │                  │ 9. Print barcode label              │
            │                  │ 10. Repeat for all units            │
            │                  └────────────┬────────────────────────┘
            │                               │
            │                               ▼
            │                  ┌─────────────────────────┐
            │                  │ Motorcycle data saved    │
            │                  │ in warehouse catalog     │
            │                  └────────────┬────────────┘
            │                               │
            ├───────────────────────────────┘
            │
            ▼
 ┌───────────────────────────────┐
 │ Admin Warehouse checks        │
 │ request against catalog data  │
 └──────────────┬────────────────┘
                │
                ▼
 ┌───────────────────────────────┐
 │ Move matched units from       │
 │ "Catalog" → "Loading"         │
 └──────────────┬────────────────┘
                │
                ▼
 ┌───────────────────────────────┐
 │ Fill Loading Form             │
 │ Confirm & validate data       │
 └──────────────┬────────────────┘
                │
          ┌─────┴──────┐
          │ Data valid? │
          └─────┬──────┘
           yes  │  no → Error notification → re-fill
                ▼
 ┌───────────────────────────────┐
 │ Export data saved             │
 │ Ready for shipment            │
 └───────────────────────────────┘
```

---

## Use Cases by Role

### Admin Warehouse

- **Entry Surat Jalan (SJ)** — Record incoming delivery notes from suppliers
- **Entry Data Form Gudang** — Enter motorcycle & accessory data (frame number, engine number, type, color, photos)
- **Entry Form Produk Keluar Gudang** — Record products leaving the warehouse
- **Entry Form Loading** — Prepare and confirm loading for export shipment
- **Get All Stock Gudang** — View complete warehouse inventory across locations

### Admin Export

- **Create Invoice** — Generate invoices for B2B clients
- **Create Form Invoice** — Build detailed invoice forms
- **Monitoring Sales, Export Situation, Audit & Shipping** — Dashboard overview of all export operations
- **Entry Product into Warehouse** — Coordinate incoming products
- **Tracking Shipment** — Track export delivery status

### Super Admin

- **Entry Data Employee, Company & Authorization** — Manage user accounts, roles, and permissions
- **General Setting** — System-wide configuration

### Finance

- **Create Form Payment** — Generate payment documents
- **Auditory Payment** — Audit and verify payment records

---

## Warehouse Entry Process (Mobile Flow)

The warehouse entry is a **multi-step wizard** designed for mobile use, allowing the admin to process each motorcycle unit one by one:

```
Step 1 — Select Travel Permit & Truck Police Number
         Display total units to scan (e.g., 120 products)
              │
              ▼
Step 2 — Capture/Upload Front View Photo
         Select Bike Type (e.g., Yamaha NMAX) & Color
              │
              ▼
Step 3 — Scan/Input Frame Number (e.g., B332-XXX)
         Capture photo of frame area
              │
              ▼
Step 4 — Scan/Input Engine Number (e.g., B3034-XXX)
         Capture photo of engine area
              │
              ▼
Step 5 — Confirmation Screen
         Review: Permit, Bike Type, Color, Frame No, Engine No
              │
              ▼
Step 6 — Generate & Print Barcode Label
         Option: "Laporkan Masalah" (Report Issue)
              │
              ▼
Step 7 — Final Confirmation
         Summary table of all scanned units (Name, Color, Qty)
         Prompt: "Do you want to finish this process?"
         Actions: [Yes] or [Add More]
```

---

## Dashboard Features (Web)

The web dashboard provides a comprehensive view of warehouse operations:

### Sidebar Navigation

**Monitoring**

- Stock Warehouse — View all stock with location filter (All / Jakarta / Surabaya)
- Leaving Warehouse — Track outgoing products
- Entry Warehouse — Monitor incoming entries
- Shipping Monitor — Track active shipments
- Situation Monitor — Overview of export situations

**Create**

- Travel Permit — Issue new travel permits
- Leaving Request — Request product departure
- Entry Request — Request new entries
- Transfer Warehouse — Transfer stock between locations

**Internal Settings**

- Import Branch — Manage branch data
- Import Catalogue — Manage product catalogs
- Import Bike — Bulk import motorcycle data

**Configuration**

- Account Management — User & role management
- Report — Generate operational reports

### Stock Warehouse Table

The main data table displays motorcycle inventory with columns:

| Column     | Description                                |
| ---------- | ------------------------------------------ |
| Date       | Entry date                                 |
| Permit No# | Travel permit reference (e.g., SO1001)     |
| No Induk   | Master ID / registration code              |
| Merk Motor | Brand (Honda, Yamaha, Suzuki, Kawasaki)    |
| Tipe Motor | Model (Beat Street, Aerox 155, NMAX, etc.) |
| Color      | Motorcycle color                           |
| Status     | Current status: `On-site` or `Transfer`    |

Summary cards show **On Stock** count vs **Total** count.

---

## Project Structure

This project follows a **Layered Architecture** pattern.

```
CBR-WAREHOUSE-SERVER/
├── drizzle/                    # Drizzle migration files
├── src/
│   ├── db/                     # Database layer
│   │   ├── index.ts            # DB client instance & export
│   │   ├── migrate.ts          # Migration runner
│   │   ├── push.ts             # Schema push utility
│   │   ├── schema.ts           # Drizzle table schemas & relations
│   │   └── test-connection.ts  # DB connection health check
│   │
│   ├── interfaces/             # Type definitions layer
│   │   └── info-interfaces.md
│   │
│   ├── repositories/           # Data access layer
│   │   └── info-repositories.md
│   │
│   ├── routes/                 # Route / controller layer
│   │   └── info-routes.md
│   │
│   ├── services/               # Business logic layer
│   │   └── info-services.md
│   │
│   └── index.ts                # App entry point
│
├── .env
├── .env.local
├── .gitignore
├── bun.lock
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
├── package.json
├── README.md
└── tsconfig.json
```

### Architecture Flow

```
Request
  │
  ▼
┌──────────────┐
│   Routes     │   ← HTTP request, input validation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Services    │   ← Business rules & orchestration
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Repositories │   ← Database queries via Drizzle ORM
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────────────┘
```

### Layer Responsibilities

- **Routes** — Define API endpoints, parse & validate incoming requests, delegate to services.
- **Services** — All business logic lives here. Services orchestrate complex operations like the warehouse entry process or export flow.
- **Repositories** — Pure data-access layer. Each repository wraps Drizzle ORM queries for a specific entity.
- **Interfaces** — Shared TypeScript types used across layers.
- **DB** — Connection setup, schema definitions, and migration utilities.

---

## Domain Entities (Planned)

Based on the business flow, the following core entities are expected:

| Entity              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `users`             | System users (Admin Export, Admin Warehouse, etc.)        |
| `companies`         | Company/branch data                                       |
| `suppliers`         | Supplier information                                      |
| `travel_permits`    | Surat Jalan / delivery notes from suppliers               |
| `motorcycles`       | Individual motorcycle records (frame no, engine no, etc.) |
| `accessories`       | Accessory inventory                                       |
| `catalogs`          | Product catalog for available stock                       |
| `warehouse_entries` | Incoming product entry records                            |
| `loading_forms`     | Loading preparation for export                            |
| `export_orders`     | Client export requests                                    |
| `invoices`          | Invoice records for B2B clients                           |
| `payments`          | Payment records and audit trail                           |
| `shipments`         | Shipment tracking data                                    |
| `branches`          | Warehouse locations (Jakarta, Surabaya, etc.)             |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://www.docker.com/) & Docker Compose
- PostgreSQL (provided via Docker)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd CBR-WAREHOUSE-SERVER

# Install dependencies
bun install

# Copy environment file
cp .env.local .env
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cbr_warehouse
PORT=3000
```

### Running with Docker

```bash
docker-compose up -d
bun run src/db/migrate.ts
bun run src/db/test-connection.ts
```

### Running Locally

```bash
bun run src/db/migrate.ts
bun run src/index.ts
```

---

## Database Management

```bash
# Generate migration from schema changes
bunx drizzle-kit generate

# Push schema directly (development only)
bun run src/db/push.ts

# Run pending migrations
bun run src/db/migrate.ts
```

---

## API Convention

```
Base URL: http://localhost:<PORT>/api/v1
```

All endpoints follow RESTful conventions with versioned prefixes.

---

## Scripts

### Development

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `bun run dev`        | Start development server (watch mode)    |

### Docker

| Command                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `bun run docker:up`        | Start all Docker services                |
| `bun run docker:down`      | Stop all Docker services                 |
| `bun run docker:logs`      | Follow all Docker container logs         |
| `bun run docker:clean`     | Stop services and remove volumes         |
| `bun run docker:rebuild`   | Rebuild image and restart all services   |
| `bun run docker:db:up`     | Start PostgreSQL container only          |
| `bun run docker:db:down`   | Stop PostgreSQL container                |
| `bun run docker:db:logs`   | Follow PostgreSQL container logs         |
| `bun run docker:app:up`    | Start app container only                 |
| `bun run docker:app:down`  | Stop app container                       |
| `bun run docker:app:logs`  | Follow app container logs                |
| `bun run docker:app:shell` | Open shell inside app container          |

### Database

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `bun run db:test`    | Test database connectivity               |
| `bun run db:push`    | Push schema directly to database         |
| `bun run db:generate`| Generate migration files from schema     |
| `bun run db:migrate` | Run pending migrations                   |
| `bun run db:studio`  | Open Drizzle Studio (DB viewer)          |
| `bun run db:psql`    | Connect to PostgreSQL via psql           |

---

## Contributing

1. Create a feature branch from `main`
2. Follow the layered architecture — place code in the correct layer
3. Keep business logic in **services**, not routes
4. Keep database queries in **repositories**, not services
5. Submit a pull request with a clear description

---

## License

This project is proprietary. All rights reserved.
