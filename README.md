# 🏍️ Warehouse Motor & Accessories Tracking System

Backend API untuk sistem manajemen warehouse motor dan aksesori dengan fitur tracking individual unit, barcode generation, branch transfer, export management, dan payment tracking.

## 📋 Features

### Core Features
- ✅ **Multi-Branch Management** - Kelola multiple gudang/cabang
- ✅ **Individual Unit Tracking** - Track setiap motor dengan frame & engine number unik
- ✅ **Barcode System** - Auto-generate dan print barcode untuk setiap unit
- ✅ **Stock Management** - Real-time stock monitoring per cabang
- ✅ **Branch Transfer** - Workflow approval perpindahan antar gudang
- ✅ **Meter Reading** - History odometer dengan validasi business rule
- ✅ **Export Management** - Full cycle export process dengan dokumen
- ✅ **Invoice & Payment** - Multi-currency payment tracking
- ✅ **Role-Based Access Control** - Granular permissions
- ✅ **Audit Trail** - Complete history tracking
- ✅ **Notification System** - Real-time notifications

### Business Rules Implemented
- 🔒 Meter reading tidak boleh menurun (PostgreSQL trigger)
- 🔒 Satu unit = satu meter aktif per tipe (unique index)
- 🔒 Stock balance validation (available + reserved + damaged = total)
- 🔒 Auto-generate barcode saat motor masuk

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM
- **Framework**: Express.js (recommended)
- **Validation**: Zod
- **Authentication**: JWT + Bcrypt

## 📁 Project Structure

```
warehouse-motor-backend/
├── src/
│   ├── db/
│   │   ├── schema.ts          # Database schema
│   │   ├── db.ts              # Database connection
│   │   ├── migrate.ts         # Migration runner
│   │   ├── seed.ts            # Database seeder
│   │   └── queries.ts         # Query examples
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── motor-units.ts
│   │   ├── stock.ts
│   │   ├── transfers.ts
│   │   └── invoices.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── services/
│   │   ├── barcode.service.ts
│   │   └── notification.service.ts
│   └── index.ts               # Entry point
├── drizzle/                   # Generated migrations
├── uploads/                   # File uploads
├── .env.example
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Node.js 18+
node --version

# PostgreSQL 14+
psql --version

# bun or bun
bun --version
```

### 2. Installation

```bash
# Clone repository
git clone https://github.com/your-repo/warehouse-motor-backend.git
cd warehouse-motor-backend

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb warehouse_motor

# Generate migrations
bun run db:generate

# Push schema to database
bun run db:push

# Or run migrations manually
bun run db:migrate

# Seed initial data
bun run db:seed
```

### 4. Run Application

```bash
# Development mode with hot reload
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

### 5. Access Drizzle Studio (Database GUI)

```bash
bun run db:studio
# Open https://local.drizzle.studio
```

## 🔐 Default Credentials

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@warehouse.com | password123 |
| Admin Gudang | gudang.jakarta@warehouse.com | password123 |
| Admin Export | export@warehouse.com | password123 |
| Finance | finance@warehouse.com | password123 |

## 📊 Database Schema

### Main Tables (25+ tables)

#### Master Data
- `branch` - Gudang/Cabang
- `user` - System users
- `role` - User roles
- `permission` - Granular permissions
- `role_permission` - Role-permission mapping
- `brand` - Motor brands
- `category` - Product categories
- `product` - Motor models
- `dealer` - Suppliers

#### Motor Tracking
- `motor_unit` - Individual motor units (core table)
- `motor_meter_reading` - Meter reading history
- `barcode_generation` - Barcode generation log
- `motor_unit_history` - Audit trail for units

#### Stock Management
- `warehouse_stock` - Aggregate stock per branch
- `stock_transaction` - Stock movements
- `branch_transfer` - Inter-branch transfers
- `branch_transfer_detail` - Transfer line items

#### Export & Finance
- `invoice` - Customer invoices
- `payment` - Payment transactions
- `packing_list` - Export packing lists
- `packing_list_detail` - Packing list items
- `export_shipment` - Shipment tracking
- `export_document` - Export documents (BL, COO, etc)

#### Accessories
- `accessories` - Spare parts catalog
- `accessories_stock` - Accessories inventory

#### System
- `audit_log` - System audit trail
- `notification` - User notifications

## 💡 Usage Examples

### Create Motor Unit

```typescript
import { db } from './db';
import * as schema from './schema';

const motorUnit = await db.insert(schema.motorUnit).values({
  productId: 1,
  frameNumber: 'MH1JC5110LK123456',
  engineNumber: 'JC51E1234567',
  color: 'Red',
  manufactureYear: 2024,
  status: 'IN_STOCK',
  currentBranchId: 1,
  dealerId: 1,
  purchasePrice: '30000000',
  sellingPrice: '35000000',
}).returning();
```

### Get Stock Summary

```typescript
import queries from './queries';

const stockSummary = await queries.getWarehouseStockSummary(branchId);
const lowStock = await queries.getLowStockItems(branchId);
```

### Create Branch Transfer

```typescript
const transfer = await queries.createBranchTransfer(
  {
    transferNumber: 'TRF-2024-001',
    fromBranchId: 1,
    toBranchId: 2,
    transferDate: new Date(),
    requestedBy: userId,
    status: 'DRAFT',
  },
  [
    {
      unitId: 123,
      productId: 1,
      requestedQty: 1,
    },
  ]
);
```

### Add Meter Reading

```typescript
const reading = await queries.addMeterReading({
  unitId: 123,
  meterType: 'ODOMETER',
  readingValue: 5000,
  readingDate: new Date(),
  recordedBy: userId,
});
```

### Search Motor Units

```typescript
const results = await queries.searchMotorUnits('MH1JC51');

const filtered = await queries.filterMotorUnits({
  branchId: 1,
  status: 'IN_STOCK',
  manufactureYearFrom: 2023,
  manufactureYearTo: 2024,
});
```

## 🔍 Advanced Queries

### Complex Joins with Drizzle

```typescript
import { db } from './db';
import { motorUnit, product, brand, branch } from './schema';
import { eq } from 'drizzle-orm';

// Using query API (recommended)
const units = await db.query.motorUnit.findMany({
  where: eq(motorUnit.status, 'IN_STOCK'),
  with: {
    product: {
      with: {
        brand: true,
        category: true,
      },
    },
    currentBranch: true,
    dealer: true,
  },
});

// Using select API
const units2 = await db
  .select()
  .from(motorUnit)
  .leftJoin(product, eq(motorUnit.productId, product.productId))
  .leftJoin(brand, eq(product.brandId, brand.brandId))
  .leftJoin(branch, eq(motorUnit.currentBranchId, branch.branchId))
  .where(eq(motorUnit.status, 'IN_STOCK'));
```

### Transactions

```typescript
import { db } from './db';

const result = await db.transaction(async (tx) => {
  // Create invoice
  const [invoice] = await tx.insert(schema.invoice).values({...}).returning();
  
  // Create packing list
  const [packingList] = await tx.insert(schema.packingList).values({
    invoiceId: invoice.invoiceId,
    ...
  }).returning();
  
  // If anything fails, entire transaction is rolled back
  return { invoice, packingList };
});
```

### Raw SQL (when needed)

```typescript
import { sql } from 'drizzle-orm';

const result = await db.execute(
  sql`
    SELECT 
      b.branch_name,
      COUNT(mu.unit_id) as total_units,
      SUM(CASE WHEN mu.status = 'IN_STOCK' THEN 1 ELSE 0 END) as available_units
    FROM motor_unit mu
    JOIN branch b ON mu.current_branch_id = b.branch_id
    GROUP BY b.branch_id, b.branch_name
  `
);
```

## 🔒 Authentication Flow

### 1. Login

```typescript
POST /api/auth/login
{
  "email": "admin@warehouse.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token",
  "user": {
    "userId": 1,
    "fullName": "Super Admin",
    "role": "SUPERADMIN",
    "branch": {...}
  }
}
```

### 2. Protected Routes

```typescript
// Add JWT token to headers
Authorization: Bearer <jwt-token>

GET /api/motor-units
GET /api/stock/summary
POST /api/transfers
```

### 3. Permission Check

```typescript
// Middleware checks user permissions
if (!user.permissions.includes('MANAGE_STOCK')) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

## 📈 Performance Tips

### 1. Use Indexes

Schema already includes indexes on frequently queried fields:
- `frame_number`, `engine_number`, `barcode` (unique indexes)
- `status`, `branch_id`, `product_id` (regular indexes)
- Composite indexes on foreign key pairs

### 2. Use Prepared Statements

```typescript
import { db } from './db';
import { eq } from 'drizzle-orm';

// Drizzle automatically uses prepared statements
const getUnit = db.query.motorUnit.findFirst({
  where: eq(motorUnit.frameNumber, frameNumber),
}).prepare();

// Reuse prepared statement
const unit1 = await getUnit.execute();
const unit2 = await getUnit.execute();
```

### 3. Batch Operations

```typescript
// Insert multiple records at once
await db.insert(schema.motorUnit).values([
  { frameNumber: 'ABC1', ... },
  { frameNumber: 'ABC2', ... },
  { frameNumber: 'ABC3', ... },
]);
```

### 4. Pagination

```typescript
import { desc } from 'drizzle-orm';

const page = 1;
const limit = 20;
const offset = (page - 1) * limit;

const units = await db.query.motorUnit.findMany({
  limit,
  offset,
  orderBy: desc(motorUnit.createdAt),
});
```

## 🧪 Testing

```bash
# Run tests
bun test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage
```

### Example Test

```typescript
import { describe, it, expect } from '@jest/globals';
import queries from './queries';

describe('Motor Unit Operations', () => {
  it('should create motor unit with auto-generated barcode', async () => {
    const unit = await queries.createMotorUnit({
      productId: 1,
      frameNumber: 'TEST123',
      engineNumber: 'ENG123',
      currentBranchId: 1,
    });
    
    expect(unit.barcode).toBeDefined();
    expect(unit.barcode).toMatch(/^MTR\d{8}\d{6}$/);
  });
  
  it('should reject meter reading lower than previous', async () => {
    await expect(
      queries.addMeterReading({
        unitId: 1,
        meterType: 'ODOMETER',
        readingValue: 1000, // Lower than previous 5000
        readingDate: new Date(),
      })
    ).rejects.toThrow('cannot be less than previous reading');
  });
});
```

## 🐛 Troubleshooting

### Connection Issues

```bash
# Test database connection
psql -U username -d warehouse_motor -h localhost

# Check if database exists
psql -l | grep warehouse_motor

# Verify .env file
cat .env | grep DATABASE_URL
```

### Migration Issues

```bash
# Drop and recreate database
dropdb warehouse_motor
createdb warehouse_motor

# Reset migrations
rm -rf drizzle/
bun run db:generate
bun run db:push
```

### Type Errors

```bash
# Regenerate types
bun run db:generate

# Check TypeScript
bunx tsc --noEmit
```

## 📝 API Documentation

### Motor Units
- `GET /api/motor-units` - List all units
- `GET /api/motor-units/:id` - Get unit details
- `POST /api/motor-units` - Create new unit
- `PUT /api/motor-units/:id` - Update unit
- `DELETE /api/motor-units/:id` - Delete unit
- `GET /api/motor-units/search?q=term` - Search units

### Stock
- `GET /api/stock/summary` - Stock summary per branch
- `GET /api/stock/low-stock` - Low stock alerts
- `POST /api/stock/transaction` - Record stock transaction

### Transfers
- `GET /api/transfers` - List transfers
- `GET /api/transfers/:id` - Transfer details
- `POST /api/transfers` - Create transfer request
- `PUT /api/transfers/:id/approve` - Approve transfer
- `PUT /api/transfers/:id/receive` - Receive transfer

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Invoice details
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/:id/payment` - Record payment

### Reports
- `GET /api/reports/stock-summary` - Stock report
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/payments` - Payment report

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

- **Backend Developer**: [Your Name]
- **Database Designer**: [Your Name]
- **Project Manager**: [Your Name]

## 📞 Support

- Email: support@warehouse.com
- Documentation: https://docs.warehouse.com
- Issues: https://github.com/your-repo/issues

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core database schema
- ✅ Basic CRUD operations
- ✅ Authentication & authorization
- ✅ Stock management

### Phase 2
- [ ] REST API endpoints
- [ ] File upload (images, documents)
- [ ] Barcode generation service
- [ ] Email notifications

### Phase 3
- [ ] GraphQL API
- [ ] Real-time updates (WebSocket)
- [ ] Advanced reporting
- [ ] Mobile app support

### Phase 4
- [ ] Analytics dashboard
- [ ] Machine learning predictions
- [ ] Multi-language support
- [ ] Cloud deployment

---

Made with ❤️ by Warehouse Motor Team