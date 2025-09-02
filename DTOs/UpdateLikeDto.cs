namespace Watchly.Api.DTOs;

public class UpdateLikeDto
{
    public int Id { get; set; }
    public int UpdateId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
