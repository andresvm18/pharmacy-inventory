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
    ('admin',    'General Administrator', '$2b$10$ISlnAwne67L8ODQnGr23LeJwNbnNIgQgUV4Dn0CVlY9IuoUtfTPn.', 'ADMIN'),
    ('farmacia', 'Laura Fernandez',       '$2b$10$uNnwLJ3l26mDamyb/9HSh.I9hchA6VFpKBxCbStAP7Qg/A.JoCc56', 'PHARMACIST'),
    ('caja',     'Marco Solano',          '$2b$10$zWbcVb1ev8w3MJme2LFK0uVytS10ZLVyX.ML0nXd.ETlCvFgpzbm2', 'CASHIER');
GO
-- =====================================================================
-- Categories (15 — enough to demonstrate pagination in Catalog)
-- =====================================================================
INSERT INTO [dbo].[Categories] ([Name])
VALUES
    ('Pain Relief'),               -- 1
    ('Antibiotics'),                -- 2
    ('Antihistamines'),             -- 3
    ('Gastrointestinal'),           -- 4
    ('Vitamins & Supplements'),     -- 5
    ('Personal Care'),              -- 6
    ('Dermatology'),                -- 7
    ('Cardiovascular'),             -- 8
    ('Respiratory'),                -- 9
    ('Diabetes Care'),              -- 10
    ('Ophthalmology'),              -- 11
    ('First Aid'),                  -- 12
    ('Women''s Health'),            -- 13
    ('Pediatrics'),                 -- 14
    ('Oral Care');                  -- 15
GO
-- =====================================================================
-- Suppliers (15 — enough to demonstrate pagination in Catalog)
-- =====================================================================
INSERT INTO [dbo].[Suppliers] ([Name], [Phone], [Email])
VALUES
    ('Central Pharma Distribution', '2222-1111', 'sales@centralpharma.example'),      -- 1
    ('LaboFarma Inc.',              '2233-4455', 'orders@labofarma.example'),         -- 2
    ('MediSupply CR',               '2244-6677', 'contact@medisupply.example'),       -- 3
    ('Global Health Supplies',      '2255-8899', 'sales@globalhealthsupplies.example'),-- 4
    ('PharmaLink Distributors',     '2266-3344', 'orders@pharmalink.example'),        -- 5
    ('Costa Rica Medical Supply',   '2277-5566', 'contact@crmedsupply.example'),      -- 6
    ('BioPharma Solutions',         '2288-1122', 'sales@biopharmasolutions.example'), -- 7
    ('National Drug Co.',           '2299-4433', 'orders@nationaldrug.example'),      -- 8
    ('Wellness Wholesale',          '2211-7788', 'contact@wellnesswholesale.example'),-- 9
    ('Prime Pharma Partners',       '2222-9900', 'sales@primepharma.example'),        -- 10
    ('HealthFirst Distribution',    '2233-6677', 'orders@healthfirst.example'),       -- 11
    ('MedEquip Supply',             '2244-1199', 'contact@medequipsupply.example'),   -- 12
    ('Continental Pharma',          '2255-3322', 'sales@continentalpharma.example'),  -- 13
    ('Unity Health Supplies',       '2266-8855', 'orders@unityhealth.example'),       -- 14
    ('Vitality Distributors',       '2277-4411', 'contact@vitalitydist.example');     -- 15
GO
-- =====================================================================
-- Products (15 — enough to demonstrate pagination in Products page)
-- =====================================================================
INSERT INTO [dbo].[Products] ([Sku], [Name], [Description], [CategoryId], [SupplierId], [UnitPrice], [MinStock], [RequiresRx])
VALUES
    ('ANL-001', 'Acetaminophen 500mg (10 tablets)',        'Analgesic and antipyretic',            1, 1, 1200.00, 30, 0),
    ('ANL-002', 'Ibuprofen 400mg (10 tablets)',            'Non-steroidal anti-inflammatory',      1, 1, 1800.00, 25, 0),
    ('ATB-001', 'Amoxicillin 500mg (12 capsules)',         'Broad-spectrum antibiotic',            2, 2, 3500.00, 15, 1),
    ('ATB-002', 'Azithromycin 500mg (3 tablets)',          'Macrolide antibiotic',                 2, 2, 4200.00, 10, 1),
    ('AHT-001', 'Loratadine 10mg (10 tablets)',            'Non-drowsy antihistamine',             3, 1, 1500.00, 20, 0),
    ('GAS-001', 'Omeprazole 20mg (14 capsules)',           'Proton pump inhibitor',                4, 2, 2800.00, 20, 0),
    ('GAS-002', 'Oral Rehydration Salts',                  'Sachet for preparing 1 liter',         4, 3,  600.00, 40, 0),
    ('VIT-001', 'Vitamin C 1g (10 effervescent tablets)',  'Vitamin supplement',                   5, 3, 2200.00, 15, 0),
    ('VIT-002', 'Vitamin B Complex (30 tablets)',          'B-group vitamin supplement',           5, 3, 3100.00, 10, 0),
    ('CUI-001', 'Hand Sanitizer Gel 250ml',                '70% antiseptic for hands',             6, 3, 1400.00, 25, 0),
    ('CVR-001', 'Amlodipine 5mg (30 tablets)',             'Antihypertensive, calcium channel blocker', 8, 4, 2500.00, 20, 1),
    ('RES-001', 'Salbutamol Inhaler 100mcg',               'Bronchodilator for asthma relief',     9, 5, 5200.00, 10, 1),
    ('DIA-001', 'Metformin 500mg (30 tablets)',            'Oral antidiabetic, first-line therapy',10, 6, 1900.00, 20, 1),
    ('OPH-001', 'Artificial Tears Eye Drops 15ml',         'Lubricant eye drops for dry eyes',     11, 7, 1600.00, 15, 0),
    ('ORA-001', 'Fluoride Toothpaste 100g',                'Cavity prevention toothpaste',         15, 8,  950.00, 30, 0);
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
    (10, 'ALC-2712A', '2027-12-31',  70,  800.00),
    (11, 'AML-2708A', '2026-08-01',  12, 1400.00),   -- EXPIRING SOON
    (11, 'AML-2706A', '2027-06-30',  40, 1380.00),
    (12, 'SAL-2705A', '2027-05-31',  25, 3900.00),
    (13, 'MET-2703A', '2027-03-31',   8, 1450.00),   -- LOW STOCK (min 20)
    (14, 'ART-2506A', '2026-06-20',   5, 1200.00),   -- EXPIRED
    (14, 'ART-2707A', '2027-07-31',  20, 1150.00),
    (15, 'FLU-2710A', '2027-10-31',  60,  550.00);
GO
-- =====================================================================
-- Stock movements: entry of each batch (audit trail)
-- =====================================================================
INSERT INTO [dbo].[StockMovements] ([BatchId], [Type], [Quantity], [Reason], [UserId])
SELECT 
    [Id],
    'PURCHASE',
    [Quantity],
    'Initial receipt of batch ' + [LotNumber],
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
    (2,  'SALE', -2, 'Sale #1', 3),
    (13, 'SALE', -1, 'Sale #1', 3);
GO
-- =====================================================================
-- Verification: check the final status
-- =====================================================================
SELECT 'Users loaded:' AS Status;
SELECT [Username], [Role] FROM [dbo].[Users];
GO
SELECT 'Products loaded:' AS Status;
SELECT [Sku], [Name], [UnitPrice] FROM [dbo].[Products];
GO
SELECT 'Current stock (from view):' AS Status;
SELECT * FROM [dbo].[v_ProductStock];
GO