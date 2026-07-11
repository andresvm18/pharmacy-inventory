using PharmacyInventory.API.Data;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using PharmacyInventory.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace PharmacyInventory.API.Services;

public interface IProductService
{
    Task<IEnumerable<ProductResponse>> GetAllActiveProductsAsync();
    Task<ProductResponse?> GetProductByIdAsync(int id);
    Task<ProductResponse?> GetProductBySkuAsync(string sku);
    Task<IEnumerable<ProductResponse>> GetProductsByCategoryAsync(int categoryId);
    Task<IEnumerable<ProductResponse>> GetProductsBySupplierAsync(int supplierId);
    Task<IEnumerable<ProductResponse>> GetLowStockProductsAsync();
    Task<ProductResponse> CreateProductAsync(CreateProductRequest request);
    Task<ProductResponse> UpdateProductAsync(int id, CreateProductRequest request);
    Task<bool> DeactivateProductAsync(int id);
}

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly IGenericRepository<Supplier> _supplierRepository;
    private readonly PharmacyDbContext _dbContext;
    private readonly ILogger<ProductService> _logger;

    public ProductService(
        IProductRepository productRepository,
        IGenericRepository<Category> categoryRepository,
        IGenericRepository<Supplier> supplierRepository,
        PharmacyDbContext dbContext,
        ILogger<ProductService> logger)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _supplierRepository = supplierRepository;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<IEnumerable<ProductResponse>> GetAllActiveProductsAsync()
    {
        var products = await _productRepository.FindAsync(p => p.IsActive);
        return await MapToResponsesAsync(products);
    }

    public async Task<ProductResponse?> GetProductByIdAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null || !product.IsActive)
            return null;

        return await MapToResponseAsync(product);
    }

    public async Task<ProductResponse?> GetProductBySkuAsync(string sku)
    {
        var product = await _productRepository.GetBySkuAsync(sku);
        if (product == null)
            return null;

        return await MapToResponseAsync(product);
    }

    public async Task<IEnumerable<ProductResponse>> GetProductsByCategoryAsync(int categoryId)
    {
        var products = await _productRepository.GetByCategoryAsync(categoryId);
        return await MapToResponsesAsync(products);
    }

    public async Task<IEnumerable<ProductResponse>> GetProductsBySupplierAsync(int supplierId)
    {
        var products = await _productRepository.GetBySupplierAsync(supplierId);
        return await MapToResponsesAsync(products);
    }

    public async Task<IEnumerable<ProductResponse>> GetLowStockProductsAsync()
    {
        var products = await _productRepository.GetLowStockAsync();
        return await MapToResponsesAsync(products);
    }

    public async Task<ProductResponse> CreateProductAsync(CreateProductRequest request)
    {
        // Validate SKU is unique
        var existingSku = await _productRepository.GetBySkuAsync(request.Sku);
        if (existingSku != null)
            throw new InvalidOperationException($"Product with SKU '{request.Sku}' already exists");

        // Validate category and supplier exist
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
        if (category == null)
            throw new InvalidOperationException($"Category with ID {request.CategoryId} not found");

        var supplier = await _supplierRepository.GetByIdAsync(request.SupplierId);
        if (supplier == null)
            throw new InvalidOperationException($"Supplier with ID {request.SupplierId} not found");

        var product = new Product
        {
            Sku = request.Sku,
            Name = request.Name,
            Description = request.Description,
            CategoryId = request.CategoryId,
            SupplierId = request.SupplierId,
            UnitPrice = request.UnitPrice,
            MinStock = request.MinStock,
            RequiresRx = request.RequiresRx,
            IsActive = true
        };

        await _productRepository.AddAsync(product);
        _logger.LogInformation($"Product created: {product.Sku} - {product.Name}");

        return await MapToResponseAsync(product);
    }

    public async Task<ProductResponse> UpdateProductAsync(int id, CreateProductRequest request)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
            throw new InvalidOperationException($"Product with ID {id} not found");

        // If SKU changed, validate uniqueness
        if (product.Sku != request.Sku)
        {
            var existingSku = await _productRepository.GetBySkuAsync(request.Sku);
            if (existingSku != null)
                throw new InvalidOperationException($"Product with SKU '{request.Sku}' already exists");
        }

        // Validate category and supplier exist
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
        if (category == null)
            throw new InvalidOperationException($"Category with ID {request.CategoryId} not found");

        var supplier = await _supplierRepository.GetByIdAsync(request.SupplierId);
        if (supplier == null)
            throw new InvalidOperationException($"Supplier with ID {request.SupplierId} not found");

        product.Sku = request.Sku;
        product.Name = request.Name;
        product.Description = request.Description;
        product.CategoryId = request.CategoryId;
        product.SupplierId = request.SupplierId;
        product.UnitPrice = request.UnitPrice;
        product.MinStock = request.MinStock;
        product.RequiresRx = request.RequiresRx;

        await _productRepository.UpdateAsync(product);
        _logger.LogInformation($"Product updated: {product.Sku} - {product.Name}");

        return await MapToResponseAsync(product);
    }

    public async Task<bool> DeactivateProductAsync(int id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
            return false;

        product.IsActive = false;
        await _productRepository.UpdateAsync(product);
        _logger.LogInformation($"Product deactivated: {product.Sku}");

        return true;
    }

    private async Task<ProductResponse> MapToResponseAsync(Product product)
    {
        var response = new ProductResponse
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Description = product.Description,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? "Unknown",
            SupplierId = product.SupplierId,
            SupplierName = product.Supplier?.Name ?? "Unknown",
            UnitPrice = product.UnitPrice,
            MinStock = product.MinStock,
            RequiresRx = product.RequiresRx,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt
        };

        // Calculate stock from batches
        var availableStock = product.Batches
            .Where(b => b.ExpiryDate >= DateTime.Now.Date)
            .Sum(b => b.Quantity);

        var expiredStock = product.Batches
            .Where(b => b.ExpiryDate < DateTime.Now.Date)
            .Sum(b => b.Quantity);

        response.StockAvailable = availableStock;
        response.StockExpired = expiredStock;

        return await Task.FromResult(response);
    }

    private async Task<IEnumerable<ProductResponse>> MapToResponsesAsync(IEnumerable<Product> products)
    {
        var responses = new List<ProductResponse>();
        foreach (var product in products)
        {
            responses.Add(await MapToResponseAsync(product));
        }
        return responses;
    }
}