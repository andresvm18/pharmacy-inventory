using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Services;
using System.Security.Claims;

namespace PharmacyInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BatchesController : ControllerBase
{
    private readonly IBatchService _batchService;
    private readonly ILogger<BatchesController> _logger;

    public BatchesController(IBatchService batchService, ILogger<BatchesController> logger)
    {
        _batchService = batchService;
        _logger = logger;
    }

    /// Create a new batch (receive stock from supplier).
    /// PHARMACIST and ADMIN only.
    [HttpPost]
    [Authorize(Roles = "PHARMACIST,ADMIN")]
    [ProducesResponseType(typeof(BatchResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateBatch([FromBody] CreateBatchRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new ErrorResponse { Message = "Invalid user context" });

            if (!ModelState.IsValid)
                return BadRequest(new ErrorResponse { Message = "Invalid batch data" });

            var batch = await _batchService.CreateBatchAsync(userId, request);
            return CreatedAtAction(nameof(GetBatchById), new { id = batch.Id }, batch);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation during batch creation");
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating batch");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error creating batch" });
        }
    }

    /// Get a specific batch by ID with product and expiration details
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchById(int id)
    {
        try
        {
            var batch = await _batchService.GetBatchByIdAsync(id);
            if (batch == null)
                return NotFound(new ErrorResponse { Message = $"Batch with ID {id} not found" });

            return Ok(batch);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting batch {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving batch" });
        }
    }

    /// Get all batches for a specific product
    [HttpGet("product/{productId}")]
    [ProducesResponseType(typeof(IEnumerable<BatchResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBatchesByProduct(int productId)
    {
        try
        {
            var batches = await _batchService.GetBatchesByProductAsync(productId);
            return Ok(batches);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, $"Product {productId} not found");
            return NotFound(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting batches for product {productId}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving batches" });
        }
    }

    /// Adjust batch stock (corrections, damage, count adjustments).
    /// Positive quantity = add, Negative = remove.
    /// PHARMACIST and ADMIN only.
    [HttpPatch("{id}/adjust-stock")]
    [Authorize(Roles = "PHARMACIST,ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AdjustStock(int id, [FromBody] AdjustStockRequest request)
    {
        try
        {
            // Extract userId from JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized(new ErrorResponse { Message = "Invalid user context" });

            if (request.Quantity == 0)
                return BadRequest(new ErrorResponse { Message = "Adjustment quantity cannot be zero" });

            var result = await _batchService.AdjustStockAsync(id, userId, request);
            if (!result)
                return NotFound(new ErrorResponse { Message = $"Batch with ID {id} not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, $"Invalid adjustment for batch {id}");
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error adjusting stock for batch {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error adjusting stock" });
        }
    }
}