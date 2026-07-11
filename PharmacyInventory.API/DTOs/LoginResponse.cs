namespace PharmacyInventory.API.DTOs;

public class LoginResponse
{
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}