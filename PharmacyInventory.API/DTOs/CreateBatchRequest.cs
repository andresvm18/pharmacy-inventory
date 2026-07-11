namespace PharmacyInventory.API.DTOs;

public class CreateBatchRequest
{
    public int ProductId { get; set; }
    public string LotNumber { get; set; } = null!;
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal CostPrice { get; set; }
}