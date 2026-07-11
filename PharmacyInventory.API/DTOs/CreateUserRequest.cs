namespace PharmacyInventory.API.DTOs;

public class CreateUserRequest
{
    public string Username { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string Role { get; set; } = null!;
}