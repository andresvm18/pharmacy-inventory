using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Services;
using System.Security.Claims;

namespace PharmacyInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISalesService _salesService;
    private readonly ILogger<SalesController> _logger;

    public SalesController(ISalesService salesService, ILogger<SalesController> logger)
    {
        _salesService = salesService;
        _logger = logger;
    }

    /// Create a new sale with FEFO batch allocation.
    /// Automatically allocates stock from batches expiring soonest.
    /// Only CASHIER and PHARMACIST can create sales.
    [HttpPost]
    [Authorize(Roles = "CASHIER,PHARMACIST")]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateSale([FromBody] CreateSaleRequest request)
    {
        try
        {
            // Extract userId from JWT claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new ErrorResponse { Message = "Invalid user context" });

            if (request == null || request.Items == null || request.Items.Count == 0)
                return BadRequest(new ErrorResponse { Message = "Sale must contain at least one item" });

            var sale = await _salesService.CreateSaleAsync(userId, request);
            return CreatedAtAction(nameof(GetSaleById), new { id = sale.Id }, sale);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation during sale creation");
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating sale");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error creating sale" });
        }
    }

    /// Get a specific sale by ID with all items and batch details
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SaleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSaleById(int id)
    {
        try
        {
            var sale = await _salesService.GetSaleByIdAsync(id);
            if (sale == null)
                return NotFound(new ErrorResponse { Message = $"Sale with ID {id} not found" });

            return Ok(sale);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting sale {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving sale" });
        }
    }

    /// Get all sales within a date range.
    /// Query parameters: startDate, endDate (ISO format: 2026-07-11)
    [HttpGet("date-range")]
    [ProducesResponseType(typeof(IEnumerable<SaleResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSalesByDateRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            if (startDate > endDate)
                return BadRequest(new ErrorResponse { Message = "Start date must be before end date" });

            var sales = await _salesService.GetSalesByDateRangeAsync(startDate, endDate);
            return Ok(sales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sales by date range");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving sales" });
        }
    }

    /// Get all sales created by a specific user.
    /// ADMIN can query any user. PHARMACIST and CASHIER can only query their own sales.
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(IEnumerable<SaleResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSalesByUser(int userId)
    {
        try
        {
            // Extract current user ID from JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var currentUserId))
                return Unauthorized(new ErrorResponse { Message = "Invalid user context" });

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Only ADMIN can query other users' sales
            if (userRole != "ADMIN" && currentUserId != userId)
                return Forbid();

            var sales = await _salesService.GetSalesByUserAsync(userId);
            return Ok(sales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting sales for user {userId}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving sales" });
        }
    }
}