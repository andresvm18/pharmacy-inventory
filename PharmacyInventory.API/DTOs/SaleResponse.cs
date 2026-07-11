namespace PharmacyInventory.API.DTOs;

public class SaleResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string UserFullName { get; set; } = null!;
    public decimal Total { get; set; }
    public List<SaleItemResponse> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}