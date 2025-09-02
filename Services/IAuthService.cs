using System.Security.Claims;
using Watchly.Api.DTOs;

namespace Watchly.Api.Services;

public interface IAuthService
{
    Task<AuthResultDto> RegisterAsync(RegisterDto dto, HttpContext http);
    Task<AuthResultDto> LoginAsync(LoginDto dto, HttpContext http);
    Task<UserDto?> GetCurrentUserAsync(ClaimsPrincipal user);
    Task LogoutAsync(HttpContext http);
}
