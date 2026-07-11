namespace PharmacyInventory.API.DTOs;

public class StockMovementResponse
{
    public int Id { get; set; }
    public int BatchId { get; set; }
    public string LotNumber { get; set; } = null!;
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string Type { get; set; } = null!; // PURCHASE, SALE, ADJUSTMENT, EXPIRED
    public int Quantity { get; set; } // Signed: positive = in, negative = out
    public string? Reason { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}