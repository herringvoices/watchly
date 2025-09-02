using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace Watchly.Api.Models;

public class User : IdentityUser
{
    [MaxLength(100)] public string FirstName { get; set; } = string.Empty;
    [MaxLength(100)] public string LastName { get; set; } = string.Empty;
    public string? ProfilePicture { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Follow> Following { get; set; } = new List<Follow>(); // as sender
    public ICollection<Follow> Followers { get; set; } = new List<Follow>(); // as recipient
    public ICollection<Media> MediaLibrary { get; set; } = new List<Media>();
    public ICollection<MediaUpdate> Updates { get; set; } = new List<MediaUpdate>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<UpdateLike> UpdateLikes { get; set; } = new List<UpdateLike>();
    public ICollection<CommentLike> CommentLikes { get; set; } = new List<CommentLike>();
}
