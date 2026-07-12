using Microsoft.AspNetCore.Mvc;
using PharmacyInventory.API.DTOs;
using PharmacyInventory.API.Services;
using Microsoft.AspNetCore.RateLimiting;

namespace PharmacyInventory.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// Login with username and password.
    /// Returns JWT token if credentials are valid.
    [HttpPost("login")]
    [EnableRateLimiting("LoginPolicy")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors);
            return BadRequest(new ErrorResponse
            {
                Message = "Validation failed",
                Details = string.Join("; ", errors.Select(e => e.ErrorMessage))
            });
        }

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new ErrorResponse
            {
                Message = "Username and password are required"
            });
        }

        try
        {
            var response = await _authService.LoginAsync(request.Username, request.Password);

            if (response == null)
            {
                return Unauthorized(new ErrorResponse
                {
                    Message = "Invalid username or password",
                    ErrorCode = 401
                });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(StatusCodes.Status500InternalServerError, new ErrorResponse
            {
                Message = "An error occurred during login",
                Details = ex.Message
            });
        }
    }

    /// Health check endpoint. Returns 200 if API is running.
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "API is running", timestamp = DateTime.UtcNow });
    }
}