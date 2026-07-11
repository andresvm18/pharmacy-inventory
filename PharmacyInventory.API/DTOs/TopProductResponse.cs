namespace PharmacyInventory.API.DTOs;

public class TopProductResponse
{
    public int ProductId { get; set; }
    public string Sku { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
}