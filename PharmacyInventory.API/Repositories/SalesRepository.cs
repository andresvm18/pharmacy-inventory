using Microsoft.EntityFrameworkCore;
using PharmacyInventory.API.Data;
using PharmacyInventory.API.Entities;

namespace PharmacyInventory.API.Repositories;

public class SalesRepository : GenericRepository<Sale>, ISalesRepository
{
    private readonly PharmacyDbContext _dbContext;

    public SalesRepository(PharmacyDbContext dbContext) : base(dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Sale?> GetSaleWithItemsAsync(int saleId)
    {
        return await _dbContext.Sales
            .Include(s => s.User)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Batch)
                    .ThenInclude(b => b.Product)
            .FirstOrDefaultAsync(s => s.Id == saleId);
    }

    public async Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbContext.Sales
            .Include(s => s.User)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Batch)
                    .ThenInclude(b => b.Product)
            .Where(s => s.CreatedAt >= startDate && s.CreatedAt <= endDate)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Sale>> GetSalesByUserAsync(int userId)
    {
        return await _dbContext.Sales
            .Include(s => s.User)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Batch)
                    .ThenInclude(b => b.Product)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }
}