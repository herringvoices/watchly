using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Watchly.Api.Models;

namespace Watchly.Api.Data;

public class WatchlyDbContext : IdentityDbContext<User>
{
    public WatchlyDbContext(DbContextOptions<WatchlyDbContext> options) : base(options) { }

    public DbSet<Follow> Follows => base.Set<Follow>();
    public DbSet<MediaRating> MediaRatings => base.Set<MediaRating>();
    public DbSet<Media> Media => base.Set<Media>();
    public DbSet<MediaUpdate> MediaUpdates => base.Set<MediaUpdate>();
    public DbSet<Comment> Comments => base.Set<Comment>();
    public DbSet<UpdateLike> UpdateLikes => base.Set<UpdateLike>();
    public DbSet<CommentLike> CommentLikes => base.Set<CommentLike>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

    // Additional model configuration can go here. Identity sets up key tables.

        modelBuilder.Entity<Follow>()
            .HasOne(f => f.Sender)
            .WithMany(u => u.Following)
            .HasForeignKey(f => f.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Follow>()
            .HasOne(f => f.Recipient)
            .WithMany(u => u.Followers)
            .HasForeignKey(f => f.RecipientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Media>()
            .HasOne(m => m.User)
            .WithMany(u => u.MediaLibrary)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MediaUpdate>()
            .HasOne(u => u.Media)
            .WithMany(m => m.Updates)
            .HasForeignKey(u => u.MediaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MediaUpdate>()
            .HasOne(u => u.User)
            .WithMany(u => u.Updates)
            .HasForeignKey(u => u.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Update)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.UpdateId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UpdateLike>()
            .HasOne(l => l.Update)
            .WithMany(u => u.Likes)
            .HasForeignKey(l => l.UpdateId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UpdateLike>()
            .HasOne(l => l.User)
            .WithMany(u => u.UpdateLikes)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CommentLike>()
            .HasOne(l => l.Comment)
            .WithMany(c => c.Likes)
            .HasForeignKey(l => l.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CommentLike>()
            .HasOne(l => l.User)
            .WithMany(u => u.CommentLikes)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique like per user per entity (optional constraints)
        modelBuilder.Entity<UpdateLike>()
            .HasIndex(l => new { l.UpdateId, l.UserId }).IsUnique();
        modelBuilder.Entity<CommentLike>()
            .HasIndex(l => new { l.CommentId, l.UserId }).IsUnique();
        modelBuilder.Entity<Follow>()
            .HasIndex(f => new { f.SenderId, f.RecipientId }).IsUnique();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                var createdProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(User.CreatedAt));
                if (createdProp != null && createdProp.CurrentValue is DateTime dt && dt == default) createdProp.CurrentValue = utcNow;
                var updatedProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(User.UpdatedAt));
                if (updatedProp != null) updatedProp.CurrentValue = utcNow;
                var lastUpdateProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(MediaRating.LastUpdate));
                if (lastUpdateProp != null) lastUpdateProp.CurrentValue = utcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                var updatedProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(User.UpdatedAt));
                if (updatedProp != null) updatedProp.CurrentValue = utcNow;
                var lastUpdateProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == nameof(MediaRating.LastUpdate));
                if (lastUpdateProp != null) lastUpdateProp.CurrentValue = utcNow;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
