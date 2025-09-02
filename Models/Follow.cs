using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Watchly.Api.Models;

public class Follow
{
    [Key] public int Id { get; set; }
    [Required] public string SenderId { get; set; } = string.Empty;
    [Required] public string RecipientId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? Sender { get; set; }
    public User? Recipient { get; set; }
}
