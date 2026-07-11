using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Services;

namespace PharmacyInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(IReportsService reportsService, ILogger<ReportsController> logger)
    {
        _reportsService = reportsService;
        _logger = logger;
    }

    /// Get revenue summary for a date range.
    /// Shows total sales count, items sold, total revenue, and average order value.
    /// Query params: startDate, endDate (ISO format: 2026-07-11)
    [HttpGet("revenue")]
    [ProducesResponseType(typeof(RevenueSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRevenueSummary(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            if (startDate > endDate)
                return BadRequest(new ErrorResponse { Message = "Start date must be before end date" });

            var report = await _reportsService.GetRevenueSummaryAsync(startDate, endDate);
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating revenue report");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error generating report" });
        }
    }

    /// Get all products expiring within a threshold (default 30 days).
    /// Shows batch details, quantity, days until expiry, and total inventory value.
    /// Query param: daysThreshold (default: 30)
    [HttpGet("expiring-products")]
    [ProducesResponseType(typeof(IEnumerable<ExpiringProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpiringProducts([FromQuery] int daysThreshold = 30)
    {
        try
        {
            if (daysThreshold <= 0)
                return BadRequest(new ErrorResponse { Message = "Days threshold must be greater than 0" });

            var products = await _reportsService.GetExpiringProductsAsync(daysThreshold);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting expiring products");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving expiring products" });
        }
    }

    /// Get complete stock movement history (audit trail).
    /// Can filter by product ID or batch ID for detailed tracking.
    /// Shows all inventory changes: purchases, sales, adjustments, expirations.
    /// Query params: productId (optional), batchId (optional)
    [HttpGet("stock-movements")]
    [ProducesResponseType(typeof(IEnumerable<StockMovementResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockMovements(
        [FromQuery] int? productId = null,
        [FromQuery] int? batchId = null)
    {
        try
        {
            var movements = await _reportsService.GetStockMovementHistoryAsync(productId, batchId);
            return Ok(movements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stock movements");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving stock movements" });
        }
    }
}