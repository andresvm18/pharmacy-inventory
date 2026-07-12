# Pharmacy Inventory Management System

Full-stack pharmacy inventory management system featuring batch and expiration date tracking (FEFO), point of sale (POS), role-based access control (RBAC), and operational reports.

> **About this repository:** This is a public reconstruction of a system I developed as a freelancer for a pharmacy client in 2023. The original code belongs to the client, so this version recreates the full architecture and functionality using mock data, while incorporating improvements learned since the original delivery.

## Stack

- **Backend:** C# + ASP.NET Core 8 (Clean Architecture + SOLID principles)
- **ORM:** Entity Framework Core 8 with SQL Server
- **Database:** SQL Server 2022
- **Frontend:** React + Vite (SPA consuming the REST API)
- **Authentication:** JWT tokens + RBAC (3 roles)
- **Security:** Fixed-window rate limiting on login (5 req/min)
- **Testing:** xUnit — unit tests + SQLite-backed integration tests
- **CI/CD:** GitHub Actions
- **Containerization:** Docker + docker-compose (SQL Server, API, frontend)
- **Charts:** Recharts (revenue trends, top products)
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)

## Features

- **Full catalog management:** Products, categories, and suppliers all have create/edit/delete UI, gated to Admin (and Pharmacist for products). Deleting a category or supplier still in use is blocked, matching the backend's referential integrity rules.
- **Batch-based inventory:** Each product is split into batches, each with a batch number, expiration date, and quantity. Total stock is a derived value. Receiving new stock and adjusting for damage/loss is done directly from the Products page.
- **FEFO-driven sales** (*first expired, first out*): Sales automatically deduct stock from the batch closest to its expiration date.
- **FEFO transparency:** Every sale shows exactly which batches were used and their expiration dates, so the allocation logic is visible, not just enforced silently.
- **Sales history:** Browsable, filterable log of past sales with per-sale batch detail, paginated.
- **Analytics dashboard:** Revenue trend charts, top-selling products, and role-aware KPIs (Admin/Pharmacist see full reports; Cashier sees inventory alerts only).
- **User management:** Admins can create accounts, edit names/roles, reset passwords, and activate/deactivate users (self-deactivation is blocked to prevent accidental lockout).
- **Traceability:** Any stock change generates an audited movement record (who, what, when, why), attributed to the authenticated user by name and role.
- **Reports:** Sales by period, upcoming expiring products, and low stock alerts.
- **RBAC:** Administrator (full access), pharmacist (inventory + sales), and cashier (sales only).
- **Product search, sort, and dual views:** Sortable table view for scanning inventory density, card view for browsing.
- **Accessible modals:** Every dialog traps focus, closes on Escape, and restores focus to the triggering element — verified across all 7 modal components in the app.
- **Client-side pagination:** Products, Catalog, Sales History, and Stock Movements all paginate at 10 items per page.

## Features by Role

| Feature | Admin | Pharmacist | Cashier |
|---------|-------|------------|---------|
| View Dashboard | ✅ | ✅ | ✅ |
| Create/Edit Products | ✅ | ✅ | ❌ |
| Receive Stock / Adjust Batches | ✅ | ✅ | ❌ |
| Manage Categories & Suppliers | ✅ | ❌ | ❌ |
| Create Sales | ✅ | ✅ | ✅ |
| View Sales History | ✅ | ✅ | ✅ |
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
│   │   ├── SuppliersController.cs
│   │   └── UsersController.cs
│   ├── Services/              # Business Logic
│   │   ├── AuthService.cs
│   │   ├── ProductService.cs
│   │   ├── SalesService.cs (FEFO logic, transactional)
│   │   ├── BatchService.cs
│   │   ├── ReportsService.cs
│   │   └── UserService.cs
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
│   ├── Program.cs
│   └── Dockerfile             # Multi-stage build (SDK → ASP.NET runtime)
├── PharmacyInventory.Tests/
│   ├── Services/              # Unit tests (password hashing, FEFO sorting, entities)
│   └── Integration/           # SQLite-backed integration tests
│       ├── SqliteTestBase.cs  # Reusable relational test fixture
│       └── SalesServiceFEFOIntegrationTests.cs
├── client/                    # React + Vite Frontend
│   ├── src/
│   │   ├── pages/            # Login, Dashboard, Sales, SalesHistory, Products, Catalog, Reports, Users
│   │   ├── components/       # Navbar, modals (Sale, Product, User, ResetPassword,
│   │   │                       Category, Supplier, Batches), Pagination
│   │   ├── services/         # API clients (api, auth, product, sales, report,
│   │   │                       category, supplier, user, batch)
│   │   ├── context/          # Auth context
│   │   ├── hooks/            # useAuth, usePagination, useModalA11y
│   │   ├── index.css         # Design tokens (clinical palette, typography)
│   │   └── App.jsx
│   ├── tailwind.config.js    # Clinical color palette + type scale
│   ├── Dockerfile            # Multi-stage build (Node → nginx)
│   ├── nginx.conf            # SPA fallback routing
│   └── package.json
├── db/
│   ├── schema.sql             # T-SQL DDL (tables, indexes, constraints)
│   ├── seed.sql                # Mock data (15 products, 15 categories, 15 suppliers)
│   └── docker-entrypoint.sh   # Waits for SQL Server, then loads schema + seed
├── docker-compose.yml         # Orchestrates db, db-init, api, client
├── .github/workflows/         # GitHub Actions CI/CD pipeline
├── PharmacyInventory.sln      # Solution file
└── README.md
~~~

## Getting Started

### Option A: Docker (recommended)

The fastest way to run the full stack — SQL Server, API, and frontend — with one command.

**Prerequisites:** Docker Desktop

```bash
# 1. Clone the repository
git clone https://github.com/andresvm18/pharmacy-inventory.git
cd pharmacy-inventory

# 2. Copy the environment template and set your own values
cp .env.docker.example .env.docker

# 3. Build and start everything
docker-compose --env-file .env.docker up --build
```

First run takes a few minutes: SQL Server initializes, then `db-init` automatically loads the schema and seed data once the database is healthy. Subsequent runs are much faster (`docker-compose --env-file .env.docker up`, no `--build` needed unless code changed).

- **Frontend:** http://localhost:5173
- **API / Swagger:** http://localhost:5000/swagger

To stop everything:
```bash
docker-compose --env-file .env.docker down
```

To reset the database completely (drops all data):
```bash
docker-compose --env-file .env.docker down -v
```

### Option B: Manual setup

For local development with hot-reload on both API and frontend.

**Prerequisites:**
- .NET 8 SDK
- SQL Server 2022 (or SQL Server Express)
- Node.js 18+

**Backend:**

```bash
# 1. Clone the repository
git clone https://github.com/andresvm18/pharmacy-inventory.git
cd pharmacy-inventory

# 2. Create SQL Server database (UTF-8 codepage required for accented characters)
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

**Frontend:**

```bash
# From root directory
cd client

# Install dependencies
npm install

# Configure API URL (optional, defaults to localhost:5000/api)
cp .env.example .env

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### Demo Credentials

The login screen has one-click buttons for each role. Credentials, if entering manually:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin123!` | Administrator |
| `farmacia` | `Pharma123!` | Pharmacist |
| `caja` | `Cashier123!` | Cashier |

Additional users can be created from the Users page (Admin only) once logged in.

## API Endpoints

### Authentication
- `POST /api/auth/login` — Authenticate and get JWT token (rate-limited: 5 requests/minute)
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

### Categories & Suppliers
- `GET /api/categories` / `GET /api/suppliers` — List all
- `POST` / `PUT` / `DELETE` — Full CRUD, restricted to ADMIN; delete blocked while products reference the record

### Sales (FEFO)
- `POST /api/sales` — Create sale with FEFO batch allocation, transactional (CASHIER/PHARMACIST)
- `GET /api/sales/{id}` — Get sale details with items and batch expiry dates
- `GET /api/sales/date-range?startDate=...&endDate=...` — Sales by period
- `GET /api/sales/user/{userId}` — Sales by user

### Batches
- `POST /api/batches` — Receive stock (PHARMACIST/ADMIN)
- `GET /api/batches/{id}` — Get batch details
- `GET /api/batches/product/{productId}` — All batches for a product
- `PATCH /api/batches/{id}/adjust-stock` — Adjust for damage/loss (PHARMACIST/ADMIN)

### Reports (ADMIN/PHARMACIST only)
- `GET /api/reports/revenue?startDate=...&endDate=...` — Revenue summary by date range
- `GET /api/reports/revenue-by-day?startDate=...&endDate=...` — Daily revenue series for charting
- `GET /api/reports/top-products?startDate=...&endDate=...&limit=5` — Best-selling products by units sold
- `GET /api/reports/expiring-products?daysThreshold=30` — Products expiring soon
- `GET /api/reports/stock-movements?productId=...` — Audit trail with user attribution

### Users (ADMIN only)
- `GET /api/users` — List all users
- `GET /api/users/{id}` — Get user by ID
- `POST /api/users` — Create a new user
- `PUT /api/users/{id}` — Update full name and role
- `PATCH /api/users/{id}/reset-password` — Reset a user's password
- `PATCH /api/users/{id}/toggle-active` — Activate or deactivate a user (blocked for your own account)

## Design Decisions

### FEFO (First Expired, First Out)
When a sale is created, the system:
1. Loads all active batches for the product, sorted by expiration date (ascending)
2. Allocates stock sequentially from the earliest-expiring batch
3. Records each batch deduction as a separate `SaleItem`
4. Generates a `StockMovement` entry for audit trail

The frontend surfaces this directly: after checkout, a confirmation modal shows exactly which lot numbers and expiration dates were used, so the allocation logic is visible rather than a black box. The same modal is reused on the Sales History page to inspect any past sale.

**Example:**
- Product "Aspirin" has 3 batches: 10 units (exp. 2026-06), 20 units (exp. 2026-09), 30 units (exp. 2026-12)
- Customer buys 25 units
- System allocates: 10 from batch 1 (exp. 2026-06) + 15 from batch 2 (exp. 2026-09)
- Remaining: 5 units in batch 2 + 30 in batch 3

### Stock Storage
- **Stock lives within batches, not the product.** In a pharmacy, expiration dates are critical; storing a single stock counter would make it impossible to know *which* units expire *when*. A product's total stock is `SUM(batch.quantity)` for active, non-expired batches.

### Price Snapshots
- **`sale_items` stores a snapshot of the price at time of sale**, not a reference to the current product price. Historical sales records must remain unchanged even if prices fluctuate. Verified directly by an integration test that changes a product's price after a sale and confirms the historical `SaleItem` is unaffected.

### Immutable Audit Trail
- **Stock movements are append-only.** Corrections are made via adjustment movements (type = `ADJUSTMENT`) rather than editing existing records, and every movement is attributed to the authenticated user (not a hardcoded system account) for genuine accountability.

### Transactional Integrity
Sale creation wraps stock deduction, movement logging, and the sale record in a single database transaction via `IExecutionStrategy` (required because the DbContext uses `EnableRetryOnFailure`). If any step fails — insufficient stock discovered mid-loop, a database error — the entire sale rolls back. No partial deductions, no orphaned records.

This is validated by integration tests, not just asserted in a comment: one test seeds a multi-item cart where the second product doesn't exist, and confirms the deduction already made for the first (valid) product is also rolled back — proving the atomicity guarantee holds for the whole cart, not just a single item.

### User Management Safeguards
Deactivating a user is blocked when the target account is the requester's own — without this guard, an admin could lock themselves out of the only account able to reactivate anyone. This is enforced in `UserService`, not just hidden in the UI, so the rule holds even if called directly through the API.

### Clean Architecture
- **Separation of Concerns:** Controllers → Services → Repositories → DbContext
- **Dependency Injection:** All dependencies are injected, no static references
- **SOLID Principles:** Single responsibility, DRY code, interfaces for contracts

### Visual Design System
The UI follows a "clinical precision" design language rather than a generic dashboard template:
- **Typography:** Fraunces (serif) for page and section headers, Inter for UI text, JetBrains Mono for all numeric data (prices, SKUs, quantities, lot numbers) so figures align predictably in tables and cards.
- **Color:** A dedicated `clinical` palette (deep teal) replaces default Tailwind greens, paired with warm `stone` neutrals instead of cold grays.
- **Structure:** Thin hairline borders instead of drop shadows; role-based navigation that hides pages a user's role can't access rather than showing and then rejecting them.

### Accessibility
Every modal in the app (7 total) shares a single `useModalA11y` hook that traps Tab focus within the dialog, closes on Escape, and restores focus to the element that opened it. This is applied consistently rather than per-modal, so new modals inherit correct behavior by default instead of accessibility being an afterthought bolted onto each one individually.

## Testing

Run all tests:

```bash
cd C:\path\to\pharmacy-inventory
dotnet test
```

**Unit tests cover:**
- Password hashing (BCrypt validation)
- User entity creation
- Batch FEFO sorting logic

**Integration tests** run the real `SalesService.CreateSaleAsync` against SQLite in-memory (a genuine relational engine with foreign keys and transactions — not the EF Core `InMemory` provider, which doesn't enforce either):
- FEFO allocation splitting a sale across two batches by expiry date
- Expired batches correctly excluded from allocation
- Insufficient stock rolls back with zero side effects
- A multi-item cart where one item fails rolls back the *entire* sale, including deductions already applied for valid items
- Price snapshots on `SaleItem` are immune to later product price changes

**CI/CD:** GitHub Actions automatically runs the full test suite on every push to `main` and `develop` branches.

## Performance Considerations

- **Database Indexes:** Composite indexes on `(ProductId, LotNumber)` for batch lookups
- **Query Optimization:** `Include()` eager loading to prevent N+1 queries; daily revenue aggregation is grouped in SQL, not in memory
- **Pagination:** Products, Catalog, Sales History, and Stock Movements paginate client-side at 10 items per page. This is a deliberate trade-off for a demo-scale dataset — see *Known Limitations*.
- **Caching:** Frontend uses localStorage for JWT tokens and user info

## Security

- **JWT Tokens:** Signed with HS256 (configurable expiration)
- **Password Hashing:** BCrypt.NET with salt
- **RBAC:** Role-based middleware authorization, enforced on both API endpoints and frontend navigation
- **Rate Limiting:** Fixed-window limiter on `/api/auth/login` (5 requests/minute per client) to blunt brute-force credential guessing, returning `429 Too Many Requests` when exceeded
- **SQL Injection Prevention:** EF Core parameterized queries
- **CORS:** Configured for localhost:5173 (frontend)

## Known Limitations

This is a portfolio demonstration, not a production deployment. Notable gaps, kept deliberately out of scope:
- **Pagination is client-side.** The backend returns full result sets and the frontend slices them into pages. This is invisible at demo data volumes but would need to move server-side (`Skip`/`Take` + a `PagedResult<T>` wrapper) once any list endpoint approaches the low thousands of rows, both to shrink payload size and avoid holding large arrays in browser memory.
- No end-to-end / UI-level test suite (Cypress, Playwright) — testing stops at the API layer.

## License

This project is for portfolio demonstration purposes. The original system was developed for a private client in 2023.

## Author

**Andrés Víquez Marchena**  
Full-stack developer | Costa Rica  
[GitHub](https://github.com/andresvm18) | [LinkedIn](https://linkedin.com/in/andresvm18)

---

**Version:** 1.5.0-hardening (July 2026)  
**Status:** Feature-complete, containerized, tested, secured, accessible, and visually polished