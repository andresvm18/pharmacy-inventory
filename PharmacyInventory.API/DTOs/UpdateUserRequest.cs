namespace PharmacyInventory.API.DTOs;

public class UpdateUserRequest
{
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = null!;
}