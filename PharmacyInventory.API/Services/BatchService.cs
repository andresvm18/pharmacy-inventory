using PharmacyInventory.API.Data;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using PharmacyInventory.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace PharmacyInventory.API.Services;

public interface IBatchService
{
    Task<BatchResponse> CreateBatchAsync(int userId, CreateBatchRequest request);
    Task<BatchResponse?> GetBatchByIdAsync(int batchId);
    Task<IEnumerable<BatchResponse>> GetBatchesByProductAsync(int productId);
    Task<bool> AdjustStockAsync(int batchId, int userId, AdjustStockRequest request);
}

public class BatchService : IBatchService
{
    private readonly IBatchRepository _batchRepository;
    private readonly IProductRepository _productRepository;
    private readonly PharmacyDbContext _dbContext;
    private readonly ILogger<BatchService> _logger;

    public BatchService(
        IBatchRepository batchRepository,
        IProductRepository productRepository,
        PharmacyDbContext dbContext,
        ILogger<BatchService> logger)
    {
        _batchRepository = batchRepository;
        _productRepository = productRepository;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// Create a new batch (receive stock from supplier).
    /// Records the initial PURCHASE stock movement for audit.
    public async Task<BatchResponse> CreateBatchAsync(int userId, CreateBatchRequest request)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId);
        if (product == null)
            throw new InvalidOperationException($"Product with ID {request.ProductId} not found");

        if (request.Quantity <= 0)
            throw new InvalidOperationException("Batch quantity must be greater than 0");

        if (request.ExpiryDate <= DateTime.Now.Date)
            throw new InvalidOperationException("Expiry date must be in the future");

        if (request.CostPrice <= 0)
            throw new InvalidOperationException("Cost price must be greater than 0");

        // Check for duplicate lot number
        var existingBatch = await _batchRepository.GetByLotNumberAsync(request.ProductId, request.LotNumber);
        if (existingBatch != null)
            throw new InvalidOperationException(
                $"Batch with lot number '{request.LotNumber}' already exists for this product");

        var batch = new Batch
        {
            ProductId = request.ProductId,
            LotNumber = request.LotNumber,
            ExpiryDate = request.ExpiryDate,
            Quantity = request.Quantity,
            CostPrice = request.CostPrice,
            ReceivedAt = DateTime.UtcNow
        };

        await _batchRepository.AddAsync(batch);

        // Record PURCHASE movement (user 1 = admin/system)
        var movement = new StockMovement
        {
            BatchId = batch.Id,
            Type = "PURCHASE",
            Quantity = request.Quantity,
            Reason = $"Received batch {request.LotNumber} from supplier",
            UserId = 1, // System/Admin records initial receipt
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.StockMovements.AddAsync(movement);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            $"Batch created: {request.LotNumber} for product {product.Sku}, qty: {request.Quantity}");

        return await MapToResponseAsync(batch);
    }

    public async Task<BatchResponse?> GetBatchByIdAsync(int batchId)
    {
        var batch = await _batchRepository.GetByIdAsync(batchId);
        if (batch == null)
            return null;

        // Reload with product relationship
        batch = await _dbContext.Batches
            .Include(b => b.Product)
            .FirstOrDefaultAsync(b => b.Id == batchId);

        return await MapToResponseAsync(batch!);
    }

    public async Task<IEnumerable<BatchResponse>> GetBatchesByProductAsync(int productId)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
            throw new InvalidOperationException($"Product with ID {productId} not found");

        var batches = await _batchRepository.GetByProductAsync(productId);
        var responses = new List<BatchResponse>();

        foreach (var batch in batches)
        {
            responses.Add(await MapToResponseAsync(batch));
        }

        return responses;
    }

    /// Adjust batch stock for corrections (damage, count adjustments, etc).
    /// Positive quantity = add, Negative = remove.
    /// Records ADJUSTMENT stock movement for audit.
    public async Task<bool> AdjustStockAsync(int batchId, int userId, AdjustStockRequest request)
    {
        var batch = await _batchRepository.GetByIdAsync(batchId);
        if (batch == null)
            return false;

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("Adjustment reason is required");

        var newQuantity = batch.Quantity + request.Quantity;
        if (newQuantity < 0)
            throw new InvalidOperationException(
                $"Cannot adjust: would result in negative stock ({batch.Quantity} + {request.Quantity})");

        batch.Quantity = newQuantity;
        await _batchRepository.UpdateAsync(batch);

        // Record ADJUSTMENT movement
        var movement = new StockMovement
        {
            BatchId = batchId,
            Type = "ADJUSTMENT",
            Quantity = request.Quantity,
            Reason = request.Reason,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        await _dbContext.StockMovements.AddAsync(movement);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            $"Batch {batchId} adjusted by {request.Quantity} units. Reason: {request.Reason}");

        return true;
    }

    private async Task<BatchResponse> MapToResponseAsync(Batch batch)
    {
        var today = DateTime.UtcNow.Date;

        var response = new BatchResponse
        {
            Id = batch.Id,
            ProductId = batch.ProductId,
            ProductSku = batch.Product?.Sku ?? "Unknown",
            ProductName = batch.Product?.Name ?? "Unknown",
            LotNumber = batch.LotNumber,
            ExpiryDate = batch.ExpiryDate,
            Quantity = batch.Quantity,
            CostPrice = batch.CostPrice,
            DaysUntilExpiry = (int)(batch.ExpiryDate - today).TotalDays,
            IsExpired = batch.ExpiryDate < today,
            ReceivedAt = batch.ReceivedAt
        };

        return await Task.FromResult(response);
    }
}