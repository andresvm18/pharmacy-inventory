using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Services;

namespace PharmacyInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// Get all active products with their current stock levels
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllProducts()
    {
        try
        {
            var products = await _productService.GetAllActiveProductsAsync();
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all products");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error retrieving products" });
        }
    }

    /// Get a specific product by ID
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductById(int id)
    {
        try
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound(new ErrorResponse { Message = $"Product with ID {id} not found" });

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting product {id}");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error retrieving product" });
        }
    }

    /// Get a product by SKU (stock keeping unit)
    [HttpGet("sku/{sku}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductBySku(string sku)
    {
        try
        {
            var product = await _productService.GetProductBySkuAsync(sku);
            if (product == null)
                return NotFound(new ErrorResponse { Message = $"Product with SKU '{sku}' not found" });

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting product by SKU {sku}");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error retrieving product" });
        }
    }

    /// Get all products in a specific category
    [HttpGet("category/{categoryId}")]
    [ProducesResponseType(typeof(IEnumerable<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductsByCategory(int categoryId)
    {
        try
        {
            var products = await _productService.GetProductsByCategoryAsync(categoryId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting products by category {categoryId}");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error retrieving products" });
        }
    }

    /// Get all products from a specific supplier
    [HttpGet("supplier/{supplierId}")]
    [ProducesResponseType(typeof(IEnumerable<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProductsBySupplier(int supplierId)
    {
        try
        {
            var products = await _productService.GetProductsBySupplierAsync(supplierId);
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting products by supplier {supplierId}");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error retrieving products" });
        }
    }

    /// Get all products with stock below minimum threshold
    [HttpGet("low-stock")]
    [ProducesResponseType(typeof(IEnumerable<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStockProducts()
    {
        try
        {
            var products = await _productService.GetLowStockProductsAsync();
            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting low stock products");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error retrieving products" });
        }
    }

    /// Create a new product (ADMIN or PHARMACIST only)
    [HttpPost]
    [Authorize(Roles = "ADMIN,PHARMACIST")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(new ErrorResponse { Message = "Invalid product data" });

            if (request.UnitPrice <= 0)
                return BadRequest(new ErrorResponse { Message = "Unit price must be greater than 0" });

            if (string.IsNullOrWhiteSpace(request.Sku) || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new ErrorResponse { Message = "SKU and Name are required" });

            var product = await _productService.CreateProductAsync(request);
            return CreatedAtAction(nameof(GetProductById), new { id = product.Id }, product);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation during product creation");
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error creating product" });
        }
    }

    /// Update an existing product (ADMIN or PHARMACIST only)
    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN,PHARMACIST")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateProductRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(new ErrorResponse { Message = "Invalid product data" });

            if (request.UnitPrice <= 0)
                return BadRequest(new ErrorResponse { Message = "Unit price must be greater than 0" });

            var product = await _productService.UpdateProductAsync(id, request);
            return Ok(product);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, $"Invalid operation updating product {id}");
            if (ex.Message.Contains("not found"))
                return NotFound(new ErrorResponse { Message = ex.Message });
            return BadRequest(new ErrorResponse { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating product {id}");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error updating product" });
        }
    }

    /// Deactivate a product (soft delete - ADMIN only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeactivateProduct(int id)
    {
        try
        {
            var result = await _productService.DeactivateProductAsync(id);
            if (!result)
                return NotFound(new ErrorResponse { Message = $"Product with ID {id} not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deactivating product {id}");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new ErrorResponse { Message = "Error deactivating product" });
        }
    }
}