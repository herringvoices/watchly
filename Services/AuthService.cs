using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Watchly.Api.DTOs;
using Watchly.Api.Models;

namespace Watchly.Api.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _config;

    public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
    }

    public async Task<AuthResultDto> RegisterAsync(RegisterDto dto, HttpContext http)
    {
        var existingByEmail = await _userManager.FindByEmailAsync(dto.Email);
        if (existingByEmail != null)
            return new AuthResultDto { Success = false, Message = "Email already in use" };
        var existingByName = await _userManager.FindByNameAsync(dto.UserName);
        if (existingByName != null)
            return new AuthResultDto { Success = false, Message = "Username already in use" };

        var user = new User
        {
            UserName = dto.UserName,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName
        };
        var createResult = await _userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
            return new AuthResultDto { Success = false, Message = string.Join("; ", createResult.Errors.Select(e => e.Description)) };

        var token = GenerateJwt(user);
        SetJwtCookie(http, token);
        return new AuthResultDto { Success = true, User = MapUser(user) };
    }

    public async Task<AuthResultDto> LoginAsync(LoginDto dto, HttpContext http)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return new AuthResultDto { Success = false, Message = "Invalid credentials" };
        var check = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: false);
        if (!check.Succeeded)
            return new AuthResultDto { Success = false, Message = "Invalid credentials" };
        var token = GenerateJwt(user);
        SetJwtCookie(http, token);
        return new AuthResultDto { Success = true, User = MapUser(user) };
    }

    public async Task<UserDto?> GetCurrentUserAsync(ClaimsPrincipal principal)
    {
        var id = principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(id)) return null;
        var user = await _userManager.FindByIdAsync(id);
        return user == null ? null : MapUser(user);
    }

    public Task LogoutAsync(HttpContext http)
    {
        http.Response.Cookies.Append("jwt", string.Empty, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(-1)
        });
        return Task.CompletedTask;
    }

    private string GenerateJwt(User user)
    {
        var secret = _config["JWT_SECRET"] ?? throw new Exception("JWT_SECRET missing");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim("username", user.UserName ?? string.Empty),
            new Claim("name", $"{user.FirstName} {user.LastName}".Trim())
        };
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void SetJwtCookie(HttpContext http, string token)
    {
        http.Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }

    private static UserDto MapUser(User user) => new()
    {
        Id = user.Id,
        UserName = user.UserName ?? string.Empty,
        Email = user.Email ?? string.Empty,
        FirstName = user.FirstName,
        LastName = user.LastName
    };
}
