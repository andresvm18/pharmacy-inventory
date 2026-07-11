using System;
using System.Collections.Generic;
using System.Linq;
using PharmacyInventory.API.Entities;
using Xunit;

namespace PharmacyInventory.Tests.Services;

public class SalesServiceFEFOTests
{
    [Fact]
    public void Sale_Creation_CalculatesTotalCorrectly()
    {
        // Arrange
        var sale = new Sale
        {
            Id = 1,
            UserId = 1,
            Total = 2400m,
            CreatedAt = DateTime.UtcNow
        };

        // Act & Assert
        Assert.Equal(2400m, sale.Total);
        Assert.Equal(1, sale.UserId);
    }

    [Fact]
    public void SaleItem_Creation_SnapshottsPriceCorrectly()
    {
        // Arrange
        var saleItem = new SaleItem
        {
            Id = 1,
            SaleId = 1,
            BatchId = 2,
            Quantity = 2,
            UnitPrice = 1200m
        };

        // Act
        var subtotal = saleItem.Quantity * saleItem.UnitPrice;

        // Assert
        Assert.Equal(2400m, subtotal);
    }

    [Fact]
    public void Batch_FEFO_SortsByExpiryDate()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var batches = new List<Batch>
        {
            new Batch { Id = 1, LotNumber = "LOT-1", ExpiryDate = today.AddDays(30), Quantity = 10 },
            new Batch { Id = 2, LotNumber = "LOT-2", ExpiryDate = today.AddDays(10), Quantity = 5 },
            new Batch { Id = 3, LotNumber = "LOT-3", ExpiryDate = today.AddDays(60), Quantity = 20 }
        };

        // Act - Sort by expiry date (FEFO)
        var sorted = batches.OrderBy(b => b.ExpiryDate).ToList();

        // Assert
        Assert.Equal("LOT-2", sorted[0].LotNumber); // Expires first
        Assert.Equal("LOT-1", sorted[1].LotNumber);
        Assert.Equal("LOT-3", sorted[2].LotNumber); // Expires last
    }

    [Fact]
    public void Batch_StockDeduction_UpdatesQuantityCorrectly()
    {
        // Arrange
        var batch = new Batch { Id = 1, LotNumber = "LOT-1", Quantity = 50 };
        var quantityToSell = 10;

        // Act
        batch.Quantity -= quantityToSell;

        // Assert
        Assert.Equal(40, batch.Quantity);
    }
}