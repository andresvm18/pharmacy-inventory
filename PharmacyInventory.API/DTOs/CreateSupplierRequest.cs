namespace PharmacyInventory.API.DTOs;

public class CreateSupplierRequest
{
    public string Name { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Email { get; set; }
}