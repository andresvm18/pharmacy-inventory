using PharmacyInventory.API.Data;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;

namespace PharmacyInventory.API.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(string username, string password);
    Task<bool> ValidateTokenAsync(string token);
}

public class AuthService : IAuthService
{
    private readonly PharmacyDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        PharmacyDbContext dbContext,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    /// Authenticate user by username and password.
    /// Returns JWT token if credentials are valid.
    public async Task<LoginResponse?> LoginAsync(string username, string password)
    {
        try
        {
            // Find user by username
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);

            if (user == null)
            {
                _logger.LogWarning($"Login attempt for non-existent user: {username}");
                return null;
            }

            // Verify password using bcrypt
            bool isPasswordValid = BCrypt.VerifyPassword(password, user.PasswordHash);
            if (!isPasswordValid)
            {
                _logger.LogWarning($"Failed login attempt for user: {username}");
                return null;
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);
            var expirationHours = int.Parse(_configuration["Jwt:ExpirationHours"] ?? "24");

            _logger.LogInformation($"User {username} logged in successfully");

            return new LoginResponse
            {
                UserId = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(expirationHours)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error during login for user: {username}");
            throw;
        }
    }

    /// Validate JWT token signature and expiration.
    public async Task<bool> ValidateTokenAsync(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(
                Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"]!)
            );

            var tokenHandler = new JwtSecurityTokenHandler();
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return await Task.FromResult(true);
        }
        catch
        {
            return await Task.FromResult(false);
        }
    }

    /// Generate JWT token with user claims.
    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"]!)
        );
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.GivenName, user.FullName),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(int.Parse(_configuration["Jwt:ExpirationHours"] ?? "24")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}