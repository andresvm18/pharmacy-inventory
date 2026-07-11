using PharmacyInventory.API.Data;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace PharmacyInventory.API.Services;

public interface IUserService
{
    Task<IEnumerable<UserResponse>> GetAllUsersAsync();
    Task<UserResponse?> GetUserByIdAsync(int id);
    Task<UserResponse> CreateUserAsync(CreateUserRequest request);
    Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request);
    Task<bool> ResetPasswordAsync(int id, string newPassword);
    Task<bool> ToggleActiveAsync(int id, int requestingUserId);
}

public class UserService : IUserService
{
    private static readonly string[] ValidRoles = { "ADMIN", "PHARMACIST", "CASHIER" };

    private readonly PharmacyDbContext _dbContext;
    private readonly ILogger<UserService> _logger;

    public UserService(PharmacyDbContext dbContext, ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<IEnumerable<UserResponse>> GetAllUsersAsync()
    {
        var users = await _dbContext.Users
            .OrderBy(u => u.Username)
            .ToListAsync();

        return users.Select(MapToResponse);
    }

    public async Task<UserResponse?> GetUserByIdAsync(int id)
    {
        var user = await _dbContext.Users.FindAsync(id);
        return user == null ? null : MapToResponse(user);
    }

    public async Task<UserResponse> CreateUserAsync(CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
            throw new InvalidOperationException("Username is required");

        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new InvalidOperationException("Full name is required");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters");

        if (!ValidRoles.Contains(request.Role))
            throw new InvalidOperationException($"Role must be one of: {string.Join(", ", ValidRoles)}");

        var existing = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);
        if (existing != null)
            throw new InvalidOperationException($"Username '{request.Username}' is already taken");

        var user = new User
        {
            Username = request.Username,
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            IsActive = true
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {Username} created with role {Role}", user.Username, user.Role);

        return MapToResponse(user);
    }

    public async Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user == null)
            throw new InvalidOperationException($"User with ID {id} not found");

        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new InvalidOperationException("Full name is required");

        if (!ValidRoles.Contains(request.Role))
            throw new InvalidOperationException($"Role must be one of: {string.Join(", ", ValidRoles)}");

        user.FullName = request.FullName;
        user.Role = request.Role;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {Username} updated", user.Username);

        return MapToResponse(user);
    }

    public async Task<bool> ResetPasswordAsync(int id, string newPassword)
    {
        var user = await _dbContext.Users.FindAsync(id);
        if (user == null)
            return false;

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Password reset for user {Username}", user.Username);

        return true;
    }

    /// Toggle a user's active status. Prevents a user from deactivating their own account,
    /// which would otherwise lock them out with no way to reactivate.
    public async Task<bool> ToggleActiveAsync(int id, int requestingUserId)
    {
        if (id == requestingUserId)
            throw new InvalidOperationException("You cannot deactivate your own account");

        var user = await _dbContext.Users.FindAsync(id);
        if (user == null)
            return false;

        user.IsActive = !user.IsActive;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("User {Username} active status set to {IsActive}", user.Username, user.IsActive);

        return true;
    }

    private static UserResponse MapToResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}