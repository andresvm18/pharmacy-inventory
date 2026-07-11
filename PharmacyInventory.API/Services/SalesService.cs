using PharmacyInventory.API.Data;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using PharmacyInventory.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace PharmacyInventory.API.Services;

public interface ISalesService
{
    Task<SaleResponse> CreateSaleAsync(int userId, CreateSaleRequest request);
    Task<SaleResponse?> GetSaleByIdAsync(int saleId);
    Task<IEnumerable<SaleResponse>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<SaleResponse>> GetSalesByUserAsync(int userId);
}

public class SalesService : ISalesService
{
    private readonly ISalesRepository _salesRepository;
    private readonly IProductRepository _productRepository;
    private readonly PharmacyDbContext _dbContext;
    private readonly ILogger<SalesService> _logger;

    public SalesService(
        ISalesRepository salesRepository,
        IProductRepository productRepository,
        PharmacyDbContext dbContext,
        ILogger<SalesService> logger)
    {
        _salesRepository = salesRepository;
        _productRepository = productRepository;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// Create a new sale with FEFO (First Expired, First Out) batch selection.
    /// Automatically allocates stock from the batch expiring soonest.
    public async Task<SaleResponse> CreateSaleAsync(int userId, CreateSaleRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            throw new InvalidOperationException("Sale must contain at least one item");

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException($"User with ID {userId} not found");

        // Create the sale
        var sale = new Sale
        {
            UserId = userId,
            Total = 0,
            CreatedAt = DateTime.UtcNow
        };

        var saleItems = new List<SaleItem>();
        decimal totalAmount = 0;

        // Process each item in the request
        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId);
            if (product == null)
                throw new InvalidOperationException($"Product with ID {item.ProductId} not found");

            if (item.Quantity <= 0)
                throw new InvalidOperationException($"Quantity must be greater than 0 for product {product.Sku}");

            // Get available batches sorted by expiry date (FEFO)
            var batches = await _dbContext.Batches
                .Where(b => b.ProductId == item.ProductId && b.ExpiryDate >= DateTime.Now.Date && b.Quantity > 0)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync();

            if (!batches.Any())
                throw new InvalidOperationException($"Insufficient stock for product {product.Sku}");

            var quantityRemaining = item.Quantity;

            // Allocate from batches in FEFO order
            foreach (var batch in batches)
            {
                if (quantityRemaining <= 0)
                    break;

                var quantityFromBatch = Math.Min(quantityRemaining, batch.Quantity);

                // Create sale item for this batch allocation
                var saleItem = new SaleItem
                {
                    BatchId = batch.Id,
                    Quantity = quantityFromBatch,
                    UnitPrice = product.UnitPrice // Snapshot price at time of sale
                };

                saleItems.Add(saleItem);
                totalAmount += quantityFromBatch * product.UnitPrice;

                // Deduct from batch
                batch.Quantity -= quantityFromBatch;
                await _dbContext.SaveChangesAsync();

                // Record stock movement
                var movement = new StockMovement
                {
                    BatchId = batch.Id,
                    Type = "SALE",
                    Quantity = -quantityFromBatch,
                    Reason = $"Sale item for product {product.Sku}",
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                await _dbContext.StockMovements.AddAsync(movement);
                await _dbContext.SaveChangesAsync();

                quantityRemaining -= quantityFromBatch;
            }

            if (quantityRemaining > 0)
                throw new InvalidOperationException(
                    $"Insufficient stock for product {product.Sku}. Requested: {item.Quantity}, Available: {item.Quantity - quantityRemaining}");
        }

        sale.Total = totalAmount;
        sale.SaleItems = saleItems;

        // Save the sale
        await _salesRepository.AddAsync(sale);

        _logger.LogInformation($"Sale #{sale.Id} created by user {user.Username} with total {totalAmount}");

        return await MapToResponseAsync(sale);
    }

    public async Task<SaleResponse?> GetSaleByIdAsync(int saleId)
    {
        var sale = await _salesRepository.GetSaleWithItemsAsync(saleId);
        if (sale == null)
            return null;

        return await MapToResponseAsync(sale);
    }

    public async Task<IEnumerable<SaleResponse>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var sales = await _salesRepository.GetSalesByDateRangeAsync(startDate, endDate);
        var responses = new List<SaleResponse>();

        foreach (var sale in sales)
        {
            responses.Add(await MapToResponseAsync(sale));
        }

        return responses;
    }

    public async Task<IEnumerable<SaleResponse>> GetSalesByUserAsync(int userId)
    {
        var sales = await _salesRepository.GetSalesByUserAsync(userId);
        var responses = new List<SaleResponse>();

        foreach (var sale in sales)
        {
            responses.Add(await MapToResponseAsync(sale));
        }

        return responses;
    }

    private async Task<SaleResponse> MapToResponseAsync(Sale sale)
    {
        var response = new SaleResponse
        {
            Id = sale.Id,
            UserId = sale.UserId,
            Username = sale.User?.Username ?? "Unknown",
            Total = sale.Total,
            CreatedAt = sale.CreatedAt
        };

        foreach (var item in sale.SaleItems)
        {
            response.Items.Add(new SaleItemResponse
            {
                Id = item.Id,
                ProductId = item.Batch.ProductId,
                ProductSku = item.Batch.Product?.Sku ?? "Unknown",
                ProductName = item.Batch.Product?.Name ?? "Unknown",
                BatchId = item.BatchId,
                LotNumber = item.Batch.LotNumber,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }

        return await Task.FromResult(response);
    }
}