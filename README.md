# Pharmacy Inventory Management System

Full-stack pharmacy inventory management system featuring batch and expiration date tracking (FEFO), point of sale (POS), role-based access control (RBAC), and operational reports.

> **About this repository:** This is a public reconstruction of a system I developed as a freelancer for a pharmacy client in 2023. The original code belongs to the client, so this version recreates the full architecture and functionality using mock data, while incorporating improvements learned since the original delivery.

## Stack

- **Backend:** C# + ASP.NET Core 8 (Clean Architecture + SOLID principles)
- **ORM:** Entity Framework Core 8 with SQL Server
- **Database:** SQL Server 2022
- **Frontend:** React + Vite (SPA consuming the REST API)
- **Authentication:** JWT tokens + RBAC (3 roles)

## Features

- Product, category, and supplier management
- **Batch-based inventory:** Each product is split into batches, each with a batch number, expiration date, and quantity. Total stock is a derived value.
- **FEFO-driven sales** (*first expired, first out*): Sales automatically deduct stock from the batch closest to its expiration date.
- **Traceability:** Any stock change generates an audited movement record (who, what, when, why).
- **Reports:** Sales by period, upcoming expiring products, and low stock alerts.
- **RBAC:** Administrator (full access), pharmacist (inventory + sales), and cashier (sales only).

## Structure
~~~
├── PharmacyInventory.API/
│   ├── Controllers/           # REST Endpoints
│   ├── Services/              # Business logic
│   ├── Repositories/          # Data access
│   ├── Entities/              # Domain models
│   ├── DTOs/                  # Data Transfer Objects
│   ├── Middleware/            # Authentication, error handling
│   ├── Data/                  # DbContext and migrations
│   ├── appsettings.json
│   └── Program.cs
├── PharmacyInventory.Core/
│   ├── Exceptions/            # Custom exceptions
│   ├── Interfaces/            # Contracts
│   └── Constants/             # Business constants
├── db/
│   ├── schema.sql             # T-SQL DDL
│   └── seed.sql               # Mock data
└── client/                    # React Frontend
~~~

## Getting Started

### Prerequisites
- .NET 8 SDK
- SQL Server 2022 (or SQL Server Express)
- Node.js 18+

### Steps

```bash
# 1. Database — execute in SQL Server Management Studio or sqlcmd
sqlcmd -S localhost -U sa -P your_password < db/schema.sql
sqlcmd -S localhost -U sa -P your_password < db/seed.sql

# 2. Backend
cd PharmacyInventory.API
cp appsettings.example.json appsettings.json  # configure SQL Server connection string
dotnet restore
dotnet run

# 3. Frontend
cd client && npm install && npm run dev
```

**Demo users:**
- `admin` / `Admin123!`
- `farmacia` / `Pharma123!`
- `caja` / `Cashier123!`

## Design Decisions

- **Stock lives within batches, not the product.** In a pharmacy, expiration dates are critical; storing a single stock counter would make it impossible to know *which* units expire *when*. A product's stock is a `SUM(quantity)` of its active batches.
- **`sale_items` stores a snapshot of the price at the time of sale**, rather than referencing the current product price. Prices fluctuate; historical sales records must remain unchanged.
- **Immutable stock movements** (append-only): Corrections are made via adjustment movements rather than editing existing records, preserving the audit trail.
- **Clean Architecture + Entity Framework Core:** Clear separation of concerns across layers (API, Core, Data), dependency inversion via injection, and versioned migrations to evolve the schema without manual scripts.