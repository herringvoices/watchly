namespace Watchly.Api.DTOs;

public class CommentLikeDto
{
    public int Id { get; set; }
    public int CommentId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
