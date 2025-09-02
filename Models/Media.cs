using System.ComponentModel.DataAnnotations;

namespace Watchly.Api.Models;

public class Media
{
    [Key] public int Id { get; set; }
    public int MediaApiId { get; set; }
    public string UserId { get; set; } = string.Empty;
    [MaxLength(300)] public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public MediaStatus MediaStatus { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
    public ICollection<MediaUpdate> Updates { get; set; } = new List<MediaUpdate>();

    // Calculated weighted rating from Updates
    public double? Rating
    {
        get
        {
            if (Updates == null || Updates.Count == 0) return null;
            int weightedSum = 0; int totalWeight = 0;
            foreach (var u in Updates)
            {
                int weight = (int)u.WatchSessionLength;
                weightedSum += u.Rating * weight;
                totalWeight += weight;
            }
            return totalWeight > 0 ? (double)weightedSum / totalWeight : null;
        }
    }
}
