namespace PharmacyInventory.API.DTOs;

public class ErrorResponse
{
    public string Message { get; set; } = null!;
    public string? Details { get; set; }
    public int? ErrorCode { get; set; }
}