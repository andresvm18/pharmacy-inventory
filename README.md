# Pharmacy Inventory Management System

Full-stack pharmacy inventory management system featuring batch and expiration date tracking (FEFO), point of sale (POS), role-based access control (RBAC), and operational reports.

> **About this repository:** This is a public reconstruction of a system I developed as a freelancer for a pharmacy client in 2023. The original code belongs to the client, so this version recreates the full architecture and functionality using mock data, while incorporating improvements learned since the original delivery.

## Stack

- **Backend:** C# + ASP.NET Core 8 (Clean Architecture + SOLID principles)
- **ORM:** Entity Framework Core 8 with SQL Server
- **Database:** SQL Server 2022
- **Frontend:** React + Vite (SPA consuming the REST API)
- **Authentication:** JWT tokens + RBAC (3 roles)
- **Testing:** xUnit + Moq
- **CI/CD:** GitHub Actions
- **Charts:** Recharts (revenue trends, top products)
- **Notifications:** Sonner (toast notifications)

## Features

- **Product, category, and supplier management**
- **Batch-based inventory:** Each product is split into batches, each with a batch number, expiration date, and quantity. Total stock is a derived value.
- **FEFO-driven sales** (*first expired, first out*): Sales automatically deduct stock from the batch closest to its expiration date.
- **Analytics dashboard:** Revenue trend charts, top-selling products, and role-aware KPIs (Admin/Pharmacist see full reports; Cashier sees inventory alerts only).
- **FEFO transparency:** Every sale shows exactly which batches were used and their expiration dates, so the allocation logic is visible, not just enforced silently.
- **Traceability:** Any stock change generates an audited movement record (who, what, when, why).
- **Reports:** Sales by period, upcoming expiring products, and low stock alerts.
- **RBAC:** Administrator (full access), pharmacist (inventory + sales), and cashier (sales only).

## Features by Role

| Feature | Admin | Pharmacist | Cashier |
|---------|-------|------------|---------|
| View Dashboard | ✅ | ✅ | ✅ |
| Create/Edit Products | ✅ | ✅ | ❌ |
| Receive Stock (Batches) | ✅ | ✅ | ❌ |
| Create Sales | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

## Project Structure
~~~
pharmacy-inventory/
├── PharmacyInventory.API/
│   ├── Controllers/           # REST Endpoints
│   │   ├── AuthController.cs
│   │   ├── ProductsController.cs
│   │   ├── SalesController.cs
│   │   ├── BatchesController.cs
│   │   ├── ReportsController.cs
│   │   ├── CategoriesController.cs
│   │   └── SuppliersController.cs
│   ├── Services/              # Business Logic
│   │   ├── AuthService.cs
│   │   ├── ProductService.cs
│   │   ├── SalesService.cs (FEFO logic)
│   │   ├── BatchService.cs
│   │   └── ReportsService.cs
│   ├── Repositories/          # Data Access Layer
│   │   ├── GenericRepository.cs
│   │   ├── ProductRepository.cs
│   │   ├── SalesRepository.cs
│   │   └── BatchRepository.cs
│   ├── Entities/              # Domain Models
│   │   ├── Product.cs
│   │   ├── Batch.cs
│   │   ├── Sale.cs
│   │   ├── User.cs
│   │   ├── Category.cs
│   │   ├── Supplier.cs
│   │   └── StockMovement.cs
│   ├── DTOs/                  # Data Transfer Objects
│   ├── Middleware/            # Global exception handler
│   ├── Data/                  # DbContext
│   ├── appsettings.json
│   └── Program.cs
├── PharmacyInventory.Tests/   # Unit Tests (xUnit)
├── client/                    # React + Vite Frontend
│   ├── src/
│   │   ├── pages/            # Login, Dashboard, Sales, Products, Reports
│   │   ├── components/       # Navbar
│   │   ├── services/         # API clients
│   │   ├── context/          # Auth context
│   │   ├── hooks/            # useAuth hook
│   │   └── App.jsx
│   └── package.json
├── db/
│   ├── schema.sql            # T-SQL DDL (tables, indexes, constraints)
│   └── seed.sql              # Mock data (10 products, 19 batches, 3 users)
├── .github/workflows/        # GitHub Actions CI/CD pipeline
├── PharmacyInventory.sln     # Solution file
└── README.md
~~~

## Getting Started

### Prerequisites

- .NET 8 SDK
- SQL Server 2022 (or SQL Server Express)
- Node.js 18+

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/andresvm18/pharmacy-inventory.git
cd pharmacy-inventory

# 2. Create SQL Server database
sqlcmd -S .\MSSQLSERVER01 -f 65001 -i db/schema.sql

# 3. Load seed data
sqlcmd -S .\MSSQLSERVER01 -f 65001 -i db/seed.sql

# 4. Navigate to API
cd PharmacyInventory.API

# 5. Configure connection string (if needed)
# Edit appsettings.json with your SQL Server instance name

# 6. Run API
dotnet run
# API runs on http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

### Frontend Setup

```bash
# From root directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin123!` | Administrator |
| `farmacia` | `Pharma123!` | Pharmacist |
| `caja` | `Cashier123!` | Cashier |

## API Endpoints

### Authentication
- `POST /api/auth/login` — Authenticate and get JWT token
- `GET /api/auth/health` — Health check

### Products
- `GET /api/products` — List all products
- `GET /api/products/{id}` — Get product by ID
- `GET /api/products/sku/{sku}` — Get product by SKU
- `GET /api/products/low-stock` — Get low stock alerts
- `GET /api/products/category/{categoryId}` — Filter by category
- `POST /api/products` — Create product (ADMIN/PHARMACIST)
- `PUT /api/products/{id}` — Update product (ADMIN/PHARMACIST)
- `DELETE /api/products/{id}` — Soft-delete product (ADMIN)

### Sales (FEFO)
- `POST /api/sales` — Create sale with FEFO batch allocation (CASHIER/PHARMACIST)
- `GET /api/sales/{id}` — Get sale details with items
- `GET /api/sales/date-range?startDate=...&endDate=...` — Sales by period
- `GET /api/sales/user/{userId}` — Sales by user

### Batches
- `POST /api/batches` — Receive stock (PHARMACIST/ADMIN)
- `GET /api/batches/{id}` — Get batch details
- `GET /api/batches/product/{productId}` — All batches for a product
- `PATCH /api/batches/{id}/adjust-stock` — Adjust for damage/loss (PHARMACIST/ADMIN)

### Reports
- `GET /api/reports/revenue?startDate=...&endDate=...` — Revenue by date range
- `GET /api/reports/expiring-products?daysThreshold=30` — Products expiring soon
- `GET /api/reports/stock-movements?productId=...` — Audit trail

## Design Decisions

### FEFO (First Expired, First Out)
When a sale is created, the system:
1. Loads all active batches for the product, sorted by expiration date (ascending)
2. Allocates stock sequentially from the earliest-expiring batch
3. Records each batch deduction as a separate `SaleItem`
4. Generates a `StockMovement` entry for audit trail

**Example:**
- Product "Aspirin" has 3 batches: 10 units (exp. 2026-06), 20 units (exp. 2026-09), 30 units (exp. 2026-12)
- Customer buys 25 units
- System allocates: 10 from batch 1 (exp. 2026-06) + 15 from batch 2 (exp. 2026-09)
- Remaining: 5 units in batch 2 + 30 in batch 3

### Stock Storage
- **Stock lives within batches, not the product.** In a pharmacy, expiration dates are critical; storing a single stock counter would make it impossible to know *which* units expire *when*. A product's total stock is `SUM(batch.quantity)` for active, non-expired batches.

### Price Snapshots
- **`sale_items` stores a snapshot of the price at time of sale**, not a reference to the current product price. Historical sales records must remain unchanged even if prices fluctuate.

### Immutable Audit Trail
- **Stock movements are append-only.** Corrections are made via adjustment movements (type = `ADJUSTMENT`) rather than editing existing records. This preserves the complete audit trail.

### Transactional Integrity
Sale creation wraps stock deduction, movement logging, and the sale record in a single database transaction via `IExecutionStrategy` (required because the DbContext uses `EnableRetryOnFailure`). If any step fails — insufficient stock discovered mid-loop, a database error — the entire sale rolls back. No partial deductions, no orphaned records.

### Clean Architecture
- **Separation of Concerns:** Controllers → Services → Repositories → DbContext
- **Dependency Injection:** All dependencies are injected, no static references
- **SOLID Principles:** Single responsibility, DRY code, interfaces for contracts

## Testing

Run unit tests:

```bash
cd C:\path\to\pharmacy-inventory
dotnet test
```

**Tests cover:**
- Password hashing (BCrypt validation)
- User entity creation
- Batch FEFO sorting
- Sale item price snapshots
- Stock deduction logic

**CI/CD:** GitHub Actions automatically runs tests on every push to `main` and `develop` branches.

## Performance Considerations

- **Database Indexes:** Composite indexes on `(ProductId, LotNumber)` for batch lookups
- **Query Optimization:** `Include()` eager loading to prevent N+1 queries
- **Pagination:** Ready for implementation (queries support `.Skip().Take()`)
- **Caching:** Frontend uses localStorage for JWT tokens and user info

## Security

- **JWT Tokens:** Signed with HS256 (configurable expiration)
- **Password Hashing:** BCrypt.NET with salt
- **RBAC:** Role-based middleware authorization
- **SQL Injection Prevention:** EF Core parameterized queries
- **CORS:** Configured for localhost:5173 (frontend)


## License

This project is for portfolio demonstration purposes. The original system was developed for a private client in 2023.

## Author

**Andrés Víquez Marchena**  
Full-stack developer | Costa Rica  
[GitHub](https://github.com/andresvm18) | [LinkedIn](https://linkedin.com/in/andresvm18)

---

**Version:** 1.0.0-initial (July 2026)  
**Status:** Feature-complete, production-ready architecture