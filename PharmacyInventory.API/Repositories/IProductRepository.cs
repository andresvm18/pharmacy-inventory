using PharmacyInventory.API.Entities;

namespace PharmacyInventory.API.Repositories;

/// Repository for Product-specific queries
public interface IProductRepository : IGenericRepository<Product>
{
    Task<Product?> GetBySkuAsync(string sku);
    Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId);
    Task<IEnumerable<Product>> GetBySupplierAsync(int supplierId);
    Task<IEnumerable<Product>> GetLowStockAsync();  // Products below MinStock
}