namespace PharmacyInventory.API.DTOs;

public class AdjustStockRequest
{
    public int Quantity { get; set; } // Positive = add, Negative = remove
    public string Reason { get; set; } = null!; // e.g., "Damage", "Count correction", "Quality check"
}