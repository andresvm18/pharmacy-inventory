using PharmacyInventory.API.Entities;

namespace PharmacyInventory.API.Repositories;

public interface ISalesRepository : IGenericRepository<Sale>
{
    Task<Sale?> GetSaleWithItemsAsync(int saleId);
    Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<Sale>> GetSalesByUserAsync(int userId);
}