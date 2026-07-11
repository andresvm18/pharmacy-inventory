namespace PharmacyInventory.API.DTOs;

public class DailyRevenueResponse
{
    public DateTime Date { get; set; }
    public int TotalSales { get; set; }
    public decimal TotalRevenue { get; set; }
}