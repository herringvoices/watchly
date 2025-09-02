using Watchly.Api.Models;

namespace Watchly.Api.DTOs;

public class MediaUpdateDto
{
    public int Id { get; set; }
    public int MediaId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string LastWatched { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Rating { get; set; }
    public WatchSessionLength WatchSessionLength { get; set; }
    public DateTime CreatedAt { get; set; }
}
