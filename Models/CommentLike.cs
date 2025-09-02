using System.ComponentModel.DataAnnotations;

namespace Watchly.Api.Models;

public class CommentLike
{
    [Key] public int Id { get; set; }
    public int CommentId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Comment? Comment { get; set; }
    public User? User { get; set; }
}
