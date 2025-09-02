using System.ComponentModel.DataAnnotations;

namespace Watchly.Api.Models;

public class MediaUpdate
{
    [Key] public int Id { get; set; }
    public int MediaId { get; set; }
    public string UserId { get; set; } = string.Empty;
    [MaxLength(255)] public string LastWatched { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Range(1,5)] public int Rating { get; set; }
    public WatchSessionLength WatchSessionLength { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Media? Media { get; set; }
    public User? User { get; set; }
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<UpdateLike> Likes { get; set; } = new List<UpdateLike>();
}
