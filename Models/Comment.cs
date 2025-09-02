using System.ComponentModel.DataAnnotations;

namespace Watchly.Api.Models;

public class Comment
{
    [Key] public int Id { get; set; }
    public int UpdateId { get; set; }
    public string UserId { get; set; } = string.Empty;
    [MaxLength(1000)] public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public MediaUpdate? Update { get; set; }
    public User? User { get; set; }
    public ICollection<CommentLike> Likes { get; set; } = new List<CommentLike>();
}
