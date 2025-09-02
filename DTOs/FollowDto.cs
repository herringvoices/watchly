namespace Watchly.Api.DTOs;

public class FollowDto
{
    public int Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string RecipientId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
