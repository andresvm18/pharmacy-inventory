namespace PharmacyInventory.API.DTOs;

public class SupplierResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int ProductCount { get; set; }
}