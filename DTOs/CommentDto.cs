using Watchly.Api.Models;

namespace Watchly.Api.DTOs;

public class CommentDto
{
    public int Id { get; set; }
    public int UpdateId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
