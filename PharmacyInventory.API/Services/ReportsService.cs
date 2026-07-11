using PharmacyInventory.API.Data;
using PharmacyInventory.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace PharmacyInventory.API.Services;

public interface IReportsService
{
    Task<RevenueSummaryResponse> GetRevenueSummaryAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<ExpiringProductResponse>> GetExpiringProductsAsync(int daysThreshold = 30);
    Task<IEnumerable<StockMovementResponse>> GetStockMovementHistoryAsync(int? productId = null, int? batchId = null);
    Task<IEnumerable<DailyRevenueResponse>> GetRevenueByDayAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<TopProductResponse>> GetTopProductsAsync(DateTime startDate, DateTime endDate, int limit = 5);
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
        var rangeStart = startDate.Date;
        var rangeEnd = endDate.Date.AddDays(1);

        var sales = await _dbContext.Sales
            .Where(s => s.CreatedAt >= rangeStart && s.CreatedAt < rangeEnd)
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
            UserFullName = movement.User?.FullName ?? "Unknown",
            UserRole = movement.User?.Role ?? "Unknown",
            CreatedAt = movement.CreatedAt
        }).ToList();

        _logger.LogInformation(
            $"Stock movement history: {response.Count} movements " +
            (productId.HasValue ? $"for product {productId}" : "") +
            (batchId.HasValue ? $"for batch {batchId}" : ""));

        return response;
    }

    /// Get daily revenue totals for a date range, including zero-sale days
    /// so the chart has a continuous X axis.
    public async Task<IEnumerable<DailyRevenueResponse>> GetRevenueByDayAsync(DateTime startDate, DateTime endDate)
    {
        var rangeStart = startDate.Date;
        var rangeEnd = endDate.Date.AddDays(1);

        // Group in the database, then fill gaps in memory
        var dailyTotals = await _dbContext.Sales
            .Where(s => s.CreatedAt >= rangeStart && s.CreatedAt < rangeEnd)
            .GroupBy(s => s.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                TotalSales = g.Count(),
                TotalRevenue = g.Sum(s => s.Total)
            })
            .ToListAsync();

        var lookup = dailyTotals.ToDictionary(d => d.Date);
        var result = new List<DailyRevenueResponse>();

        for (var day = rangeStart; day < rangeEnd; day = day.AddDays(1))
        {
            if (lookup.TryGetValue(day, out var data))
            {
                result.Add(new DailyRevenueResponse
                {
                    Date = day,
                    TotalSales = data.TotalSales,
                    TotalRevenue = data.TotalRevenue
                });
            }
            else
            {
                result.Add(new DailyRevenueResponse { Date = day, TotalSales = 0, TotalRevenue = 0 });
            }
        }

        return result;
    }

    /// Get best-selling products by units sold in a date range.
    public async Task<IEnumerable<TopProductResponse>> GetTopProductsAsync(
        DateTime startDate, DateTime endDate, int limit = 5)
    {
        var rangeStart = startDate.Date;
        var rangeEnd = endDate.Date.AddDays(1);

        var topProducts = await _dbContext.SaleItems
            .Where(si => si.Sale.CreatedAt >= rangeStart && si.Sale.CreatedAt < rangeEnd)
            .GroupBy(si => new
            {
                si.Batch.ProductId,
                si.Batch.Product.Sku,
                si.Batch.Product.Name
            })
            .Select(g => new TopProductResponse
            {
                ProductId = g.Key.ProductId,
                Sku = g.Key.Sku,
                Name = g.Key.Name,
                UnitsSold = g.Sum(si => si.Quantity),
                Revenue = g.Sum(si => si.Quantity * si.UnitPrice)
            })
            .OrderByDescending(t => t.UnitsSold)
            .Take(limit)
            .ToListAsync();

        return topProducts;
    }
}