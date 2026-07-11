namespace PharmacyInventory.API.DTOs;

public class ExpiringProductResponse
{
    public int ProductId { get; set; }
    public string Sku { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int BatchId { get; set; }
    public string LotNumber { get; set; } = null!;
    public int Quantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int DaysUntilExpiry { get; set; }
    public decimal TotalValue { get; set; } // quantity * unit_price
}