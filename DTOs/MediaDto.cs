using Watchly.Api.Models;

namespace Watchly.Api.DTOs;

public class MediaDto
{
    public int Id { get; set; }
    public int MediaApiId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public MediaStatus MediaStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public double? Rating { get; set; } // computed externally when mapping
}
