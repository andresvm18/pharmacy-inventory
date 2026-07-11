using PharmacyInventory.API.Entities;

namespace PharmacyInventory.API.Repositories;

public interface IBatchRepository : IGenericRepository<Batch>
{
    Task<Batch?> GetByLotNumberAsync(int productId, string lotNumber);
    Task<IEnumerable<Batch>> GetByProductAsync(int productId);
    Task<IEnumerable<Batch>> GetExpiredBatchesAsync();
    Task<IEnumerable<Batch>> GetExpiringBatchesAsync(int daysThreshold = 30);
}