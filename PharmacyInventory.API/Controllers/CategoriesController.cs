using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using PharmacyInventory.API.Repositories;

namespace PharmacyInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(
        IGenericRepository<Category> categoryRepository,
        IProductRepository productRepository,
        ILogger<CategoriesController> logger)
    {
        _categoryRepository = categoryRepository;
        _productRepository = productRepository;
        _logger = logger;
    }

    /// Get all categories with product count
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CategoryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var categories = await _categoryRepository.GetAllAsync();
            var responses = new List<CategoryResponse>();

            foreach (var cat in categories)
            {
                var products = await _productRepository.GetByCategoryAsync(cat.Id);
                responses.Add(new CategoryResponse
                {
                    Id = cat.Id,
                    Name = cat.Name,
                    ProductCount = products.Count()
                });
            }

            return Ok(responses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving categories" });
        }
    }

    /// Get a specific category by ID
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new ErrorResponse { Message = $"Category with ID {id} not found" });

            var products = await _productRepository.GetByCategoryAsync(id);
            return Ok(new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                ProductCount = products.Count()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting category {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error retrieving category" });
        }
    }

    /// Create a new category (ADMIN only)
    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new ErrorResponse { Message = "Category name is required" });

            var category = new Category { Name = request.Name };
            await _categoryRepository.AddAsync(category);

            return CreatedAtAction(nameof(GetById), new { id = category.Id },
                new CategoryResponse { Id = category.Id, Name = category.Name, ProductCount = 0 });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error creating category" });
        }
    }

    /// Update a category (ADMIN only)
    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(int id, [FromBody] CreateCategoryRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new ErrorResponse { Message = "Category name is required" });

            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new ErrorResponse { Message = $"Category with ID {id} not found" });

            category.Name = request.Name;
            await _categoryRepository.UpdateAsync(category);

            var products = await _productRepository.GetByCategoryAsync(id);
            return Ok(new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                ProductCount = products.Count()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating category {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error updating category" });
        }
    }

    /// Delete a category (ADMIN only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new ErrorResponse { Message = $"Category with ID {id} not found" });

            var products = await _productRepository.GetByCategoryAsync(id);
            if (products.Any())
                return BadRequest(new ErrorResponse 
                { 
                    Message = $"Cannot delete category with {products.Count()} products" 
                });

            await _categoryRepository.DeleteAsync(category);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting category {id}");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new ErrorResponse { Message = "Error deleting category" });
        }
    }
}