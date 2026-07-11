using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using PharmacyInventory.API.Repositories;

namespace PharmacyInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly IGenericRepository<Supplier> _supplierRepository;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(
        IGenericRepository<Supplier> supplierRepository,
        IProductRepository productRepository,
        ILogger<SuppliersController> logger)
    {
        _supplierRepository = supplierRepository;
        _productRepository = productRepository;
        _logger = logger;
    }

    /// Get all suppliers with product count
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SupplierResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var suppliers = await _supplierRepository.GetAllAsync();
            var responses = new List<SupplierResponse>();

            foreach (var sup in suppliers)
            {
                var products = await _productRepository.GetBySupplierAsync(sup.Id);
                responses.Add(new SupplierResponse
                {
                    Id = sup.Id,
                    Name = sup.Name,
                    Phone = sup.Phone,
                    Email = sup.Email,
                    ProductCount = products.Count()
                });
            }

            return Ok(responses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting suppliers");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving suppliers" });
        }
    }

    /// Get a specific supplier by ID
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SupplierResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null)
                return NotFound(new ErrorResponse { Message = $"Supplier with ID {id} not found" });

            var products = await _productRepository.GetBySupplierAsync(id);
            return Ok(new SupplierResponse
            {
                Id = supplier.Id,
                Name = supplier.Name,
                Phone = supplier.Phone,
                Email = supplier.Email,
                ProductCount = products.Count()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting supplier {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving supplier" });
        }
    }

    /// Create a new supplier (ADMIN only)
    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(SupplierResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateSupplierRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new ErrorResponse { Message = "Supplier name is required" });

            var supplier = new Supplier
            {
                Name = request.Name,
                Phone = request.Phone,
                Email = request.Email
            };
            await _supplierRepository.AddAsync(supplier);

            return CreatedAtAction(nameof(GetById), new { id = supplier.Id },
                new SupplierResponse { Id = supplier.Id, Name = supplier.Name, ProductCount = 0 });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error creating supplier" });
        }
    }

    /// Update a supplier (ADMIN only)
    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(SupplierResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(int id, [FromBody] CreateSupplierRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new ErrorResponse { Message = "Supplier name is required" });

            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null)
                return NotFound(new ErrorResponse { Message = $"Supplier with ID {id} not found" });

            supplier.Name = request.Name;
            supplier.Phone = request.Phone;
            supplier.Email = request.Email;
            await _supplierRepository.UpdateAsync(supplier);

            var products = await _productRepository.GetBySupplierAsync(id);
            return Ok(new SupplierResponse
            {
                Id = supplier.Id,
                Name = supplier.Name,
                Phone = supplier.Phone,
                Email = supplier.Email,
                ProductCount = products.Count()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating supplier {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error updating supplier" });
        }
    }

    /// Delete a supplier (ADMIN only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var supplier = await _supplierRepository.GetByIdAsync(id);
            if (supplier == null)
                return NotFound(new ErrorResponse { Message = $"Supplier with ID {id} not found" });

            var products = await _productRepository.GetBySupplierAsync(id);
            if (products.Any())
                return BadRequest(new ErrorResponse 
                { 
                    Message = $"Cannot delete supplier with {products.Count()} products" 
                });

            await _supplierRepository.DeleteAsync(supplier);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting supplier {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error deleting supplier" });
        }
    }
}