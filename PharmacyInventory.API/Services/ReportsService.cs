using PharmacyInventory.API.Data;
using PharmacyInventory.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace PharmacyInventory.API.Services;

public interface IReportsService
{
    Task<RevenueSummaryResponse> GetRevenueSummaryAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<ExpiringProductResponse>> GetExpiringProductsAsync(int daysThreshold = 30);
    Task<IEnumerable<StockMovementResponse>> GetStockMovementHistoryAsync(int? productId = null, int? batchId = null);
}

public class ReportsService : IReportsService
{
    private readonly PharmacyDbContext _dbContext;
    private readonly ILogger<ReportsService> _logger;

    public ReportsService(PharmacyDbContext dbContext, ILogger<ReportsService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// Get revenue summary for a date range.
    /// Includes total sales, items sold, revenue, and average order value.
    public async Task<RevenueSummaryResponse> GetRevenueSummaryAsync(DateTime startDate, DateTime endDate)
    {
        var sales = await _dbContext.Sales
            .Where(s => s.CreatedAt >= startDate && s.CreatedAt <= endDate)
            .Include(s => s.SaleItems)
            .ToListAsync();

        var totalRevenue = sales.Sum(s => s.Total);
        var totalItems = sales.SelectMany(s => s.SaleItems).Sum(si => si.Quantity);
        var totalSales = sales.Count;
        var averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        _logger.LogInformation(
            $"Revenue report: {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd} - " +
            $"Sales: {totalSales}, Revenue: {totalRevenue}, Items: {totalItems}");

        return new RevenueSummaryResponse
        {
            StartDate = startDate,
            EndDate = endDate,
            TotalSales = totalSales,
            TotalItemsSold = totalItems,
            TotalRevenue = totalRevenue,
            AverageOrderValue = averageOrderValue
        };
    }

    /// Get all products expiring within threshold days.
    /// Shows batch details and calculated expiration urgency.
    public async Task<IEnumerable<ExpiringProductResponse>> GetExpiringProductsAsync(int daysThreshold = 30)
    {
        var today = DateTime.UtcNow.Date;
        var thresholdDate = today.AddDays(daysThreshold);

        var expiringBatches = await _dbContext.Batches
            .Where(b => b.ExpiryDate >= today && b.ExpiryDate <= thresholdDate && b.Quantity > 0)
            .Include(b => b.Product)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();

        var response = expiringBatches.Select(batch => new ExpiringProductResponse
        {
            ProductId = batch.ProductId,
            Sku = batch.Product.Sku,
            Name = batch.Product.Name,
            BatchId = batch.Id,
            LotNumber = batch.LotNumber,
            Quantity = batch.Quantity,
            ExpiryDate = batch.ExpiryDate,
            DaysUntilExpiry = (int)(batch.ExpiryDate - today).TotalDays,
            TotalValue = batch.Quantity * batch.Product.UnitPrice
        }).ToList();

        _logger.LogInformation(
            $"Expiring products report: {response.Count} batches expiring in {daysThreshold} days");

        return response;
    }

    /// Get stock movement audit trail.
    /// Can filter by product or batch for detailed tracking.
    /// Shows all inventory changes with user accountability.
    public async Task<IEnumerable<StockMovementResponse>> GetStockMovementHistoryAsync(
        int? productId = null,
        int? batchId = null)
    {
        var query = _dbContext.StockMovements
            .Include(sm => sm.Batch)
                .ThenInclude(b => b.Product)
            .Include(sm => sm.User)
            .AsQueryable();

        if (productId.HasValue)
        {
            query = query.Where(sm => sm.Batch.ProductId == productId.Value);
        }

        if (batchId.HasValue)
        {
            query = query.Where(sm => sm.BatchId == batchId.Value);
        }

        var movements = await query
            .OrderByDescending(sm => sm.CreatedAt)
            .ToListAsync();

        var response = movements.Select(movement => new StockMovementResponse
        {
            Id = movement.Id,
            BatchId = movement.BatchId,
            LotNumber = movement.Batch.LotNumber,
            ProductId = movement.Batch.ProductId,
            ProductSku = movement.Batch.Product.Sku,
            ProductName = movement.Batch.Product.Name,
            Type = movement.Type,
            Quantity = movement.Quantity,
            Reason = movement.Reason,
            UserId = movement.UserId,
            Username = movement.User?.Username ?? "Unknown",
            CreatedAt = movement.CreatedAt
        }).ToList();

        _logger.LogInformation(
            $"Stock movement history: {response.Count} movements " +
            (productId.HasValue ? $"for product {productId}" : "") +
            (batchId.HasValue ? $"for batch {batchId}" : ""));

        return response;
    }
}