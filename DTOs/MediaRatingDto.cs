namespace Watchly.Api.DTOs;

public class MediaRatingDto
{
    public int Id { get; set; }
    public int MediaApiId { get; set; }
    public double SumOfRatings { get; set; }
    public int NumberOfRatings { get; set; }
    public double Rating { get; set; }
    public DateTime LastUpdate { get; set; }
}
