using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Watchly.Api.DTOs;
using Watchly.Api.Services;

namespace Watchly.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) { _authService = authService; }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto, HttpContext);
        if (!result.Success) return BadRequest(new { result.Message });
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto, HttpContext);
        if (!result.Success) return BadRequest(new { result.Message });
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await _authService.GetCurrentUserAsync(User);
        if (user == null) return Unauthorized();
        return Ok(user);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _authService.LogoutAsync(HttpContext);
        return NoContent();
    }
}
