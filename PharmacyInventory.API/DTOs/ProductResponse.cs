namespace PharmacyInventory.API.DTOs;

public class ProductResponse
{
    public int Id { get; set; }
    public string Sku { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = null!;
    public decimal UnitPrice { get; set; }
    public int MinStock { get; set; }
    public bool RequiresRx { get; set; }
    public int StockAvailable { get; set; }
    public int StockExpired { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}