-- =============================================================
-- Pharmacy Inventory Management System — Schema (SQL Server)
-- =============================================================

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PharmacyInventory')
BEGIN
    CREATE DATABASE PharmacyInventory
    COLLATE SQL_Latin1_General_CP1_CI_AS;
END
GO

USE PharmacyInventory;
GO

-- =====================================================================
-- Users and roles
-- =====================================================================
CREATE TABLE [dbo].[Users] (
    [Id]           INT IDENTITY(1,1) PRIMARY KEY,
    [Username]     NVARCHAR(50)  NOT NULL UNIQUE,
    [FullName]     NVARCHAR(100) NOT NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,                          -- bcrypt
    [Role]         NVARCHAR(20)  NOT NULL DEFAULT 'CASHIER'         -- ADMIN, PHARMACIST, CASHIER
        CONSTRAINT CK_Users_Role CHECK ([Role] IN ('ADMIN','PHARMACIST','CASHIER')),
    [IsActive]     BIT           NOT NULL DEFAULT 1,                -- soft-delete
    [CreatedAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- =====================================================================
-- Catalogs: categories, suppliers, products
-- =====================================================================
CREATE TABLE [dbo].[Categories] (
    [Id]   INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(80) NOT NULL UNIQUE
);
GO

CREATE TABLE [dbo].[Suppliers] (
    [Id]    INT IDENTITY(1,1) PRIMARY KEY,
    [Name]  NVARCHAR(120) NOT NULL,
    [Phone] NVARCHAR(30),
    [Email] NVARCHAR(120)
);
GO

CREATE TABLE [dbo].[Products] (
    [Id]          INT IDENTITY(1,1) PRIMARY KEY,
    [Sku]         NVARCHAR(30)   NOT NULL UNIQUE,
    [Name]        NVARCHAR(150)  NOT NULL,
    [Description] NVARCHAR(MAX),
    [CategoryId]  INT            NOT NULL REFERENCES [dbo].[Categories]([Id]),
    [SupplierId]  INT            NOT NULL REFERENCES [dbo].[Suppliers]([Id]),
    [UnitPrice]   DECIMAL(10,2)  NOT NULL,                          -- price of sale
    [MinStock]    INT            NOT NULL DEFAULT 10,               -- alert threshold
    [RequiresRx]  BIT            NOT NULL DEFAULT 0,                -- requires prescription
    [IsActive]    BIT            NOT NULL DEFAULT 1,
    [CreatedAt]   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX [IX_Products_CategoryId] ON [dbo].[Products]([CategoryId]);
CREATE INDEX [IX_Products_SupplierId] ON [dbo].[Products]([SupplierId]);
GO

-- =====================================================================
-- Batches: the actual stock lives here, not in products
-- =====================================================================
CREATE TABLE [dbo].[Batches] (
    [Id]         INT IDENTITY(1,1) PRIMARY KEY,
    [ProductId]  INT            NOT NULL REFERENCES [dbo].[Products]([Id]),
    [LotNumber]  NVARCHAR(40)   NOT NULL,
    [ExpiryDate] DATE           NOT NULL,
    [Quantity]   INT            NOT NULL DEFAULT 0,                 -- units remaining
    [CostPrice]  DECIMAL(10,2)  NOT NULL,                           -- cost per unit
    [ReceivedAt] DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT [UQ_Batches_ProductLot] UNIQUE ([ProductId], [LotNumber])
);
GO

CREATE INDEX [IX_Batches_ExpiryDate] ON [dbo].[Batches]([ExpiryDate]);
CREATE INDEX [IX_Batches_ProductId]  ON [dbo].[Batches]([ProductId]);
GO

-- =====================================================================
-- Sales
-- =====================================================================
CREATE TABLE [dbo].[Sales] (
    [Id]        INT IDENTITY(1,1) PRIMARY KEY,
    [UserId]    INT           NOT NULL REFERENCES [dbo].[Users]([Id]),
    [Total]     DECIMAL(10,2) NOT NULL,
    [CreatedAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX [IX_Sales_CreatedAt] ON [dbo].[Sales]([CreatedAt]);
CREATE INDEX [IX_Sales_UserId]    ON [dbo].[Sales]([UserId]);
GO

CREATE TABLE [dbo].[SaleItems] (
    [Id]        INT IDENTITY(1,1) PRIMARY KEY,
    [SaleId]    INT           NOT NULL REFERENCES [dbo].[Sales]([Id]) ON DELETE CASCADE,
    [BatchId]   INT           NOT NULL REFERENCES [dbo].[Batches]([Id]),
    [Quantity]  INT           NOT NULL,
    [UnitPrice] DECIMAL(10,2) NOT NULL                              -- snapshot of the price
);
GO

CREATE INDEX [IX_SaleItems_SaleId]  ON [dbo].[SaleItems]([SaleId]);
CREATE INDEX [IX_SaleItems_BatchId] ON [dbo].[SaleItems]([BatchId]);
GO

-- =====================================================================
-- Stock movements (audit trail, append-only)
-- =====================================================================
CREATE TABLE [dbo].[StockMovements] (
    [Id]        INT IDENTITY(1,1) PRIMARY KEY,
    [BatchId]   INT           NOT NULL REFERENCES [dbo].[Batches]([Id]),
    [Type]      NVARCHAR(20)  NOT NULL                              -- PURCHASE, SALE, ADJUSTMENT, EXPIRED
        CONSTRAINT CK_StockMovements_Type CHECK ([Type] IN ('PURCHASE','SALE','ADJUSTMENT','EXPIRED')),
    [Quantity]  INT           NOT NULL,                             -- with sign: +entry / -exit
    [Reason]    NVARCHAR(200),
    [UserId]    INT           NOT NULL REFERENCES [dbo].[Users]([Id]),
    [CreatedAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX [IX_StockMovements_BatchId]   ON [dbo].[StockMovements]([BatchId]);
CREATE INDEX [IX_StockMovements_CreatedAt] ON [dbo].[StockMovements]([CreatedAt]);
GO

-- =====================================================================
-- View: actual stock by product (current vs expired)
-- =====================================================================
CREATE VIEW [dbo].[v_ProductStock] AS
SELECT
    p.[Id],
    p.[Sku],
    p.[Name],
    p.[MinStock],
    ISNULL(SUM(CASE WHEN b.[ExpiryDate] >= CAST(GETDATE() AS DATE) THEN b.[Quantity] ELSE 0 END), 0) AS [StockAvailable],
    ISNULL(SUM(CASE WHEN b.[ExpiryDate] < CAST(GETDATE() AS DATE) THEN b.[Quantity] ELSE 0 END), 0)  AS [StockExpired]
FROM [dbo].[Products] p
LEFT JOIN [dbo].[Batches] b ON b.[ProductId] = p.[Id]
WHERE p.[IsActive] = 1
GROUP BY p.[Id], p.[Sku], p.[Name], p.[MinStock];
GO