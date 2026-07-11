namespace PharmacyInventory.API.DTOs;

public class CreateSaleRequest
{
    public List<CreateSaleItemRequest> Items { get; set; } = new();
}