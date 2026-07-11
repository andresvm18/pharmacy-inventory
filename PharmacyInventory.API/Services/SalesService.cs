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
    /// The entire operation (stock deduction, movements, sale) runs in a single
    /// transaction: either everything commits or nothing does.
    public async Task<SaleResponse> CreateSaleAsync(int userId, CreateSaleRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
            throw new InvalidOperationException("Sale must contain at least one item");

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException($"User with ID {userId} not found");

        // EnableRetryOnFailure requires wrapping manual transactions in an execution strategy
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        var saleId = await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync();

            var sale = new Sale
            {
                UserId = userId,
                Total = 0,
                CreatedAt = DateTime.UtcNow
            };

            decimal totalAmount = 0;
            var today = DateTime.UtcNow.Date;

            foreach (var item in request.Items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null)
                    throw new InvalidOperationException($"Product with ID {item.ProductId} not found");

                if (item.Quantity <= 0)
                    throw new InvalidOperationException($"Quantity must be greater than 0 for product {product.Sku}");

                // FEFO: batches sorted by expiry date ascending, expired excluded
                var batches = await _dbContext.Batches
                    .Where(b => b.ProductId == item.ProductId && b.ExpiryDate >= today && b.Quantity > 0)
                    .OrderBy(b => b.ExpiryDate)
                    .ToListAsync();

                var totalAvailable = batches.Sum(b => b.Quantity);
                if (totalAvailable < item.Quantity)
                    throw new InvalidOperationException(
                        $"Insufficient stock for product {product.Sku}. Requested: {item.Quantity}, Available: {totalAvailable}");

                var quantityRemaining = item.Quantity;

                foreach (var batch in batches)
                {
                    if (quantityRemaining <= 0)
                        break;

                    var quantityFromBatch = Math.Min(quantityRemaining, batch.Quantity);

                    sale.SaleItems.Add(new SaleItem
                    {
                        BatchId = batch.Id,
                        Quantity = quantityFromBatch,
                        UnitPrice = product.UnitPrice // Snapshot price at time of sale
                    });

                    totalAmount += quantityFromBatch * product.UnitPrice;
                    batch.Quantity -= quantityFromBatch;

                    _dbContext.StockMovements.Add(new StockMovement
                    {
                        BatchId = batch.Id,
                        Type = "SALE",
                        Quantity = -quantityFromBatch,
                        Reason = $"Sale item for product {product.Sku}",
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    });

                    quantityRemaining -= quantityFromBatch;
                }
            }

            sale.Total = totalAmount;
            _dbContext.Sales.Add(sale);

            // Single SaveChanges: one atomic write for sale + items + movements + batch updates
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return sale.Id;
        });

        _logger.LogInformation("Sale #{SaleId} created by user {Username}", saleId, user.Username);

        // Reload with full graph for the response
        var createdSale = await _salesRepository.GetSaleWithItemsAsync(saleId);
        return MapToResponse(createdSale!);
    }

    public async Task<SaleResponse?> GetSaleByIdAsync(int saleId)
    {
        var sale = await _salesRepository.GetSaleWithItemsAsync(saleId);
        if (sale == null)
            return null;

        return MapToResponse(sale);
    }

    public async Task<IEnumerable<SaleResponse>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        var sales = await _salesRepository.GetSalesByDateRangeAsync(startDate, endDate);
        var responses = new List<SaleResponse>();

        foreach (var sale in sales)
        {
            responses.Add(MapToResponse(sale));
        }

        return responses;
    }

    public async Task<IEnumerable<SaleResponse>> GetSalesByUserAsync(int userId)
    {
        var sales = await _salesRepository.GetSalesByUserAsync(userId);
        var responses = new List<SaleResponse>();

        foreach (var sale in sales)
        {
            responses.Add(MapToResponse(sale));
        }

        return responses;
    }

    private static SaleResponse MapToResponse(Sale sale)
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
                ExpiryDate = item.Batch.ExpiryDate,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }

        return response;
    }
}