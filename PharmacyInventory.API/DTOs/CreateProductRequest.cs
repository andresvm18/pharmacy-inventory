namespace PharmacyInventory.API.DTOs;

public class CreateProductRequest
{
    public string Sku { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public int SupplierId { get; set; }
    public decimal UnitPrice { get; set; }
    public int MinStock { get; set; } = 10;
    public bool RequiresRx { get; set; } = false;
}