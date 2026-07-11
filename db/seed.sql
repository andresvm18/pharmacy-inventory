-- =============================================================
-- Pharmacy Inventory Management System — Seed Data (T-SQL)
-- Passwords: admin/Admin123!  farmacia/Pharma123!  caja/Cashier123!
-- =============================================================
USE PharmacyInventory;
GO

-- =====================================================================
-- Users (with bcrypt hashes)
-- =====================================================================
INSERT INTO [dbo].[Users] ([Username], [FullName], [PasswordHash], [Role])
VALUES
    ('admin',    'Administrador General', '$2b$10$ISlnAwne67L8ODQnGr23LeJwNbnNIgQgUV4Dn0CVlY9IuoUtfTPn.', 'ADMIN'),
    ('farmacia', 'Laura Fernández',       '$2b$10$uNnwLJ3l26mDamyb/9HSh.I9hchA6VFpKBxCbStAP7Qg/A.JoCc56', 'PHARMACIST'),
    ('caja',     'Marco Solano',          '$2b$10$zWbcVb1ev8w3MJme2LFK0uVytS10ZLVyX.ML0nXd.ETlCvFgpzbm2', 'CASHIER');
GO

-- =====================================================================
-- Categories
-- =====================================================================
INSERT INTO [dbo].[Categories] ([Name])
VALUES
    ('Analgésicos'),
    ('Antibióticos'),
    ('Antihistamínicos'),
    ('Gastrointestinales'),
    ('Vitaminas y suplementos'),
    ('Cuidado personal');
GO

-- =====================================================================
-- Suppliers
-- =====================================================================
INSERT INTO [dbo].[Suppliers] ([Name], [Phone], [Email])
VALUES
    ('Distribuidora Farmacéutica Central', '2222-1111', 'ventas@dfcentral.example'),
    ('LaboFarma S.A.',                     '2233-4455', 'pedidos@labofarma.example'),
    ('MediSuministros CR',                 '2244-6677', 'contacto@medisuministros.example');
GO

-- =====================================================================
-- Products
-- =====================================================================
INSERT INTO [dbo].[Products] ([Sku], [Name], [Description], [CategoryId], [SupplierId], [UnitPrice], [MinStock], [RequiresRx])
VALUES
    ('ANL-001', 'Acetaminofén 500mg (10 tabletas)',  'Analgésico y antipirético',            1, 1, 1200.00, 30, 0),
    ('ANL-002', 'Ibuprofeno 400mg (10 tabletas)',    'Antiinflamatorio no esteroideo',       1, 1, 1800.00, 25, 0),
    ('ATB-001', 'Amoxicilina 500mg (12 cápsulas)',   'Antibiótico de amplio espectro',       2, 2, 3500.00, 15, 1),
    ('ATB-002', 'Azitromicina 500mg (3 tabletas)',   'Antibiótico macrólido',                2, 2, 4200.00, 10, 1),
    ('AHT-001', 'Loratadina 10mg (10 tabletas)',     'Antihistamínico no sedante',           3, 1, 1500.00, 20, 0),
    ('GAS-001', 'Omeprazol 20mg (14 cápsulas)',      'Inhibidor de bomba de protones',       4, 2, 2800.00, 20, 0),
    ('GAS-002', 'Sales de rehidratación oral',       'Sobre para preparar 1 litro',          4, 3,  600.00, 40, 0),
    ('VIT-001', 'Vitamina C 1g (10 tabletas efervescentes)', 'Suplemento vitamínico',        5, 3, 2200.00, 15, 0),
    ('VIT-002', 'Complejo B (30 tabletas)',          'Suplemento de vitaminas del grupo B',  5, 3, 3100.00, 10, 0),
    ('CUI-001', 'Alcohol en gel 250ml',              'Antiséptico para manos 70%',           6, 3, 1400.00, 25, 0);
GO

-- =====================================================================
-- Batches (with varying expiration statuses: expired, nearing expiration, valid)
-- =====================================================================
INSERT INTO [dbo].[Batches] ([ProductId], [LotNumber], [ExpiryDate], [Quantity], [CostPrice])
VALUES
    (1,  'ACT-2506A', '2026-06-15',  12,  700.00),   -- EXPIRED
    (1,  'ACT-2509A', '2026-09-30',  50,  710.00),
    (1,  'ACT-2510A', '2026-10-31', 100,  715.00),
    (1,  'ACT-2511B', '2026-11-30',  80,  720.00),
    (1,  'ACT-2703A', '2027-03-31', 120,  710.00),
    (2,  'IBU-2508A', '2026-08-05',  18, 1050.00),   -- EXPIRING SOON
    (2,  'IBU-2704A', '2027-04-30',  60, 1100.00),
    (3,  'AMX-2607A', '2026-07-25',  10, 2100.00),   -- EXPIRING SOON
    (3,  'AMX-2612A', '2026-12-31',  35, 2150.00),
    (4,  'AZI-2705A', '2027-05-31',  22, 2600.00),
    (5,  'LOR-2605A', '2026-05-20',   8,  850.00),   -- EXPIRED
    (5,  'LOR-2709A', '2027-09-30',  50,  880.00),
    (6,  'OME-2701A', '2027-01-31',  45, 1700.00),
    (7,  'SRO-2610A', '2026-10-15', 100,  300.00),
    (8,  'VTC-2702A', '2027-02-28',  30, 1300.00),
    (9,  'CPB-2612A', '2026-12-15',   6, 1900.00),   -- LOW STOCK (min 10)
    (10, 'ALC-2608A', '2026-08-31',  15,  750.00),   -- EXPIRING SOON
    (10, 'ALC-2712A', '2027-12-31',  70,  800.00);
GO

-- =====================================================================
-- Stock movements: entry of each batch (audit trail)
-- =====================================================================
INSERT INTO [dbo].[StockMovements] ([BatchId], [Type], [Quantity], [Reason], [UserId])
SELECT 
    [Id],
    'PURCHASE',
    [Quantity],
    'Recepción inicial lote ' + [LotNumber],
    1  -- Admin user registers the first entry
FROM [dbo].[Batches];
GO

-- =====================================================================
-- Sample sale (recorded by the cashier)
-- 2 x Acetaminophen (batch ACT-2511B) + 1 x Vitamin C
-- =====================================================================
INSERT INTO [dbo].[Sales] ([UserId], [Total])
VALUES (3, 4600.00);
GO

-- Get the ID of the sale we just created
DECLARE @SaleId INT = SCOPE_IDENTITY();

INSERT INTO [dbo].[SaleItems] ([SaleId], [BatchId], [Quantity], [UnitPrice])
VALUES
    (@SaleId, 2, 2, 1200.00),   -- 2 x Acetaminophen from batch ACT-2511B
    (@SaleId, 13, 1, 2200.00);  -- 1 x Vitamin C from batch VTC-2702A
GO

-- Update batch quantities (deduct sales)
UPDATE [dbo].[Batches] SET [Quantity] = [Quantity] - 2 WHERE [Id] = 2;
UPDATE [dbo].[Batches] SET [Quantity] = [Quantity] - 1 WHERE [Id] = 13;
GO

-- Record outbound movements due to sales
INSERT INTO [dbo].[StockMovements] ([BatchId], [Type], [Quantity], [Reason], [UserId])
VALUES
    (2,  'SALE', -2, 'Venta #1', 3),
    (13, 'SALE', -1, 'Venta #1', 3);
GO

-- =====================================================================
-- Verification: check the final status
-- =====================================================================
SELECT 'Usuarios cargados:' AS Status;
SELECT [Username], [Role] FROM [dbo].[Users];
GO

SELECT 'Productos cargados:' AS Status;
SELECT [Sku], [Name], [UnitPrice] FROM [dbo].[Products];
GO

SELECT 'Stock actual (desde vista):' AS Status;
SELECT * FROM [dbo].[v_ProductStock];
GO