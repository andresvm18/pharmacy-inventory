namespace PharmacyInventory.API.DTOs;

public class BatchResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string LotNumber { get; set; } = null!;
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
    public int DaysUntilExpiry { get; set; }
    public bool IsExpired { get; set; }
    public DateTime ReceivedAt { get; set; }
}