using Microsoft.EntityFrameworkCore;
using PharmacyInventory.API.Data;
using PharmacyInventory.API.Entities;

namespace PharmacyInventory.API.Repositories;

public class BatchRepository : GenericRepository<Batch>, IBatchRepository
{
    private readonly PharmacyDbContext _dbContext;

    public BatchRepository(PharmacyDbContext dbContext) : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Batch?> GetByLotNumberAsync(int productId, string lotNumber)
    {
        return await _dbContext.Batches
            .Include(b => b.Product)
            .FirstOrDefaultAsync(b => b.ProductId == productId && b.LotNumber == lotNumber);
    }

    public async Task<IEnumerable<Batch>> GetByProductAsync(int productId)
    {
        return await _dbContext.Batches
            .Where(b => b.ProductId == productId)
            .Include(b => b.Product)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Batch>> GetExpiredBatchesAsync()
    {
        var today = DateTime.UtcNow.Date;
        return await _dbContext.Batches
            .Where(b => b.ExpiryDate < today && b.Quantity > 0)
            .Include(b => b.Product)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Batch>> GetExpiringBatchesAsync(int daysThreshold = 30)
    {
        var today = DateTime.UtcNow.Date;
        var thresholdDate = today.AddDays(daysThreshold);

        return await _dbContext.Batches
            .Where(b => b.ExpiryDate >= today && b.ExpiryDate <= thresholdDate && b.Quantity > 0)
            .Include(b => b.Product)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();
    }
}