using System.ComponentModel.DataAnnotations;

namespace Watchly.Api.Models;

public class MediaRating
{
    [Key] public int Id { get; set; }
    public int MediaApiId { get; set; }
    public double SumOfRatings { get; set; }
    public int NumberOfRatings { get; set; }
    public double Rating => NumberOfRatings == 0 ? 0 : SumOfRatings / NumberOfRatings;
    public DateTime LastUpdate { get; set; } = DateTime.UtcNow;
}
