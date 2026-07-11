using Microsoft.EntityFrameworkCore;
using PharmacyInventory.API.Data;
using PharmacyInventory.API.Entities;

namespace PharmacyInventory.API.Repositories;

/// Product repository with business-specific queries
public class ProductRepository : GenericRepository<Product>, IProductRepository
{
  private readonly PharmacyDbContext _dbContext;

  public ProductRepository(PharmacyDbContext dbContext) : base(dbContext)
  {
    _dbContext = dbContext;
  }

  public async Task<Product?> GetBySkuAsync(string sku)
  {
    return await _dbContext.Products
        .Include(p => p.Category)
        .Include(p => p.Supplier)
        .FirstOrDefaultAsync(p => p.Sku == sku && p.IsActive);
  }

  public async Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId)
  {
    return await _dbContext.Products
        .Where(p => p.CategoryId == categoryId && p.IsActive)
        .OrderBy(p => p.Name)
        .ToListAsync();
  }

  public async Task<IEnumerable<Product>> GetBySupplierAsync(int supplierId)
  {
    return await _dbContext.Products
        .Where(p => p.SupplierId == supplierId && p.IsActive)
        .OrderBy(p => p.Name)
        .ToListAsync();
  }

  /// Get products where total available stock is below MinStock threshold
  public async Task<IEnumerable<Product>> GetLowStockAsync()
  {
    var products = await _dbContext.Products
        .Where(p => p.IsActive)
        .Include(p => p.Batches)
        .ToListAsync();

    // Filter in memory: calculate stock per product and check against MinStock
    return products.Where(p =>
        p.Batches
            .Where(b => b.ExpiryDate >= DateTime.Now.Date)
            .Sum(b => b.Quantity) < p.MinStock);
  }
}