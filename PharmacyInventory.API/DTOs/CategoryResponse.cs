namespace PharmacyInventory.API.DTOs;

public class CategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int ProductCount { get; set; }
}