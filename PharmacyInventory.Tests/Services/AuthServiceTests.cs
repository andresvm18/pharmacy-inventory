using PharmacyInventory.API.Entities;
using Xunit;
using BCrypt.Net;

namespace PharmacyInventory.Tests.Services;

public class AuthServiceTests
{
    [Fact]
    public void PasswordHashing_ValidPassword_VerifiesCorrectly()
    {
        // Arrange
        var password = "TestPass123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

        // Act
        var isValid = BCrypt.Net.BCrypt.Verify(password, hashedPassword);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public void PasswordHashing_WrongPassword_VerifiesFalse()
    {
        // Arrange
        var correctPassword = "CorrectPass123!";
        var wrongPassword = "WrongPass123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(correctPassword);

        // Act
        var isValid = BCrypt.Net.BCrypt.Verify(wrongPassword, hashedPassword);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public void User_Creation_StoresPropertiesCorrectly()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            FullName = "Test User",
            PasswordHash = "hashed_password",
            Role = "ADMIN",
            IsActive = true
        };

        // Act & Assert
        Assert.Equal(1, user.Id);
        Assert.Equal("testuser", user.Username);
        Assert.Equal("ADMIN", user.Role);
        Assert.True(user.IsActive);
    }
}