using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using PharmacyInventory.API.Repositories;
using PharmacyInventory.API.Services;
using Xunit;

namespace PharmacyInventory.Tests.Integration;

/// Exercises the real SalesService.CreateSaleAsync against a real (SQLite) database,
/// covering the actual FEFO allocation, transactional rollback, and audit trail —
/// not just isolated unit assertions on entity properties.
public class SalesServiceFEFOIntegrationTests : SqliteTestBase
{
  private readonly ISalesService _salesService;
  private readonly int _cashierId;
  private readonly int _productId;

  public SalesServiceFEFOIntegrationTests()
  {
    var salesRepository = new SalesRepository(DbContext);
    var productRepository = new ProductRepository(DbContext);

    _salesService = new SalesService(
        salesRepository,
        productRepository,
        DbContext,
        NullLogger<SalesService>.Instance);

    // Seed a minimal but realistic catalog: category, supplier, product, user
    var category = new Category { Name = "Pain Relief" };
    var supplier = new Supplier { Name = "Test Supplier" };
    DbContext.Categories.Add(category);
    DbContext.Suppliers.Add(supplier);
    DbContext.SaveChanges();

    var product = new Product
    {
      Sku = "TEST-001",
      Name = "Test Acetaminophen",
      CategoryId = category.Id,
      SupplierId = supplier.Id,
      UnitPrice = 100m,
      MinStock = 10,
      IsActive = true,
    };
    DbContext.Products.Add(product);

    var cashier = new User
    {
      Username = "test-cashier",
      FullName = "Test Cashier",
      PasswordHash = "not-used-in-this-test",
      Role = "CASHIER",
      IsActive = true,
    };
    DbContext.Users.Add(cashier);

    DbContext.SaveChanges();

    _productId = product.Id;
    _cashierId = cashier.Id;
  }

  private void SeedBatch(string lotNumber, int daysFromToday, int quantity)
  {
    DbContext.Batches.Add(new Batch
    {
      ProductId = _productId,
      LotNumber = lotNumber,
      ExpiryDate = DateTime.UtcNow.Date.AddDays(daysFromToday),
      Quantity = quantity,
      CostPrice = 50m,
    });
    DbContext.SaveChanges();
  }

  [Fact]
  public async Task CreateSale_AllocatesFromEarliestExpiringBatchFirst()
  {
    // Arrange: two valid batches, earliest-expiring has fewer units than requested
    SeedBatch("EARLY-001", daysFromToday: 10, quantity: 10);
    SeedBatch("LATE-001", daysFromToday: 90, quantity: 20);

    var request = new CreateSaleRequest
    {
      Items = { new CreateSaleItemRequest { ProductId = _productId, Quantity = 15 } }
    };

    // Act
    var result = await _salesService.CreateSaleAsync(_cashierId, request);

    // Assert: sale should have split across both batches, earliest first
    Assert.Equal(1500m, result.Total); // 15 units * 100
    Assert.Equal(2, result.Items.Count);

    var earlyItem = result.Items.Single(i => i.LotNumber == "EARLY-001");
    var lateItem = result.Items.Single(i => i.LotNumber == "LATE-001");

    Assert.Equal(10, earlyItem.Quantity); // fully drained
    Assert.Equal(5, lateItem.Quantity);   // remainder from the later batch

    // Assert: batch quantities were actually deducted in the database
    var earlyBatch = await DbContext.Batches.FirstAsync(b => b.LotNumber == "EARLY-001");
    var lateBatch = await DbContext.Batches.FirstAsync(b => b.LotNumber == "LATE-001");
    Assert.Equal(0, earlyBatch.Quantity);
    Assert.Equal(15, lateBatch.Quantity);

    // Assert: audit trail recorded for both deductions
    var movements = await DbContext.StockMovements
        .Where(sm => sm.Type == "SALE")
        .ToListAsync();
    Assert.Equal(2, movements.Count);
    Assert.All(movements, m => Assert.Equal(_cashierId, m.UserId));
    Assert.Contains(movements, m => m.Quantity == -10);
    Assert.Contains(movements, m => m.Quantity == -5);
  }

  [Fact]
  public async Task CreateSale_ExcludesExpiredBatchesFromAllocation()
  {
    // Arrange: an expired batch that should never be touched, plus a valid one
    SeedBatch("EXPIRED-001", daysFromToday: -5, quantity: 100);
    SeedBatch("VALID-001", daysFromToday: 30, quantity: 20);

    var request = new CreateSaleRequest
    {
      Items = { new CreateSaleItemRequest { ProductId = _productId, Quantity = 5 } }
    };

    // Act
    var result = await _salesService.CreateSaleAsync(_cashierId, request);

    // Assert: allocation came only from the valid batch
    Assert.Single(result.Items);
    Assert.Equal("VALID-001", result.Items[0].LotNumber);

    var expiredBatch = await DbContext.Batches.FirstAsync(b => b.LotNumber == "EXPIRED-001");
    Assert.Equal(100, expiredBatch.Quantity); // untouched
  }

  [Fact]
  public async Task CreateSale_WithInsufficientStock_RollsBackCompletely()
  {
    // Arrange: only 10 units exist, customer wants 50
    SeedBatch("LIMITED-001", daysFromToday: 30, quantity: 10);

    var request = new CreateSaleRequest
    {
      Items = { new CreateSaleItemRequest { ProductId = _productId, Quantity = 50 } }
    };

    // Act & Assert: should throw and leave the database completely untouched
    await Assert.ThrowsAsync<InvalidOperationException>(
        () => _salesService.CreateSaleAsync(_cashierId, request));

    DbContext.ChangeTracker.Clear();

    var batch = await DbContext.Batches.FirstAsync(b => b.LotNumber == "LIMITED-001");
    Assert.Equal(10, batch.Quantity); // no partial deduction happened

    Assert.Empty(DbContext.Sales);
    Assert.Empty(DbContext.SaleItems);
    Assert.Empty(DbContext.StockMovements);
  }

  [Fact]
  public async Task CreateSale_MultiProductSale_WhereSecondProductFails_RollsBackFirstProductToo()
  {
    // Arrange: product 1 has plenty of stock, but a second product in the same
    // cart doesn't exist — the whole transaction must roll back, including
    // the otherwise-valid deduction already made for product 1.
    SeedBatch("OK-001", daysFromToday: 30, quantity: 50);

    var request = new CreateSaleRequest
    {
      Items =
            {
                new CreateSaleItemRequest { ProductId = _productId, Quantity = 5 },
                new CreateSaleItemRequest { ProductId = 9999, Quantity = 1 }, // does not exist
            }
    };

    // Act & Assert
    await Assert.ThrowsAsync<InvalidOperationException>(
        () => _salesService.CreateSaleAsync(_cashierId, request));

    // The in-memory change tracker may still hold the uncommitted, in-memory
    // mutation made before the exception (batch.Quantity -= 5). The database
    // transaction itself rolled back correctly; we clear tracked entities to
    // force a fresh read from SQLite and verify the persisted state, not the
    // stale tracked instance.
    DbContext.ChangeTracker.Clear();

    var batch = await DbContext.Batches.FirstAsync(b => b.LotNumber == "OK-001");
    Assert.Equal(50, batch.Quantity); // product 1's valid deduction was rolled back too

    Assert.Empty(DbContext.Sales);
  }

  [Fact]
  public async Task CreateSale_SnapshotsUnitPriceAtTimeOfSale()
  {
    // Arrange
    SeedBatch("PRICE-001", daysFromToday: 30, quantity: 10);

    var request = new CreateSaleRequest
    {
      Items = { new CreateSaleItemRequest { ProductId = _productId, Quantity = 3 } }
    };

    // Act
    var result = await _salesService.CreateSaleAsync(_cashierId, request);

    // Now change the product's current price — historical sale must not change
    var product = await DbContext.Products.FindAsync(_productId);
    product!.UnitPrice = 999m;
    await DbContext.SaveChangesAsync();

    // Assert: the sale item still reflects the price at the time of purchase
    var saleItem = await DbContext.SaleItems.FirstAsync(si => si.SaleId == result.Id);
    Assert.Equal(100m, saleItem.UnitPrice);
  }
}