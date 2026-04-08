using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Vaquita.Domain.Entities;

namespace Vaquita.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Participant> Participants => Set<Participant>();
    public DbSet<ConsumptionItem> ConsumptionItems => Set<ConsumptionItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrganizerName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.EventName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AdminCode).IsRequired().HasMaxLength(8);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.TipPercentage).HasPrecision(5, 2);

            entity.OwnsOne(e => e.PaymentInfo, pi =>
            {
                pi.Property(p => p.BankName).HasColumnName("PaymentInfo_BankName").HasMaxLength(100);
                pi.Property(p => p.AccountType).HasColumnName("PaymentInfo_AccountType").HasMaxLength(50);
                pi.Property(p => p.AccountNumber).HasColumnName("PaymentInfo_AccountNumber").HasMaxLength(500);
                pi.Property(p => p.Rut).HasColumnName("PaymentInfo_Rut").HasMaxLength(500);
                pi.Property(p => p.HolderName).HasColumnName("PaymentInfo_HolderName").HasMaxLength(500);
                pi.Property(p => p.Email).HasColumnName("PaymentInfo_Email").HasMaxLength(500);
            });

            entity.HasMany(e => e.Participants)
                  .WithOne(p => p.Event)
                  .HasForeignKey(p => p.EventId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Participant>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(100);
            entity.Property(p => p.Phone).HasMaxLength(20);
            entity.Property(p => p.Amount).HasPrecision(18, 2);
            entity.Property(p => p.UniqueToken).IsRequired().HasMaxLength(22);
            entity.HasIndex(p => p.UniqueToken).IsUnique();

            entity.HasMany(p => p.Items)
                  .WithOne(i => i.Participant)
                  .HasForeignKey(i => i.ParticipantId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ConsumptionItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Description).IsRequired().HasMaxLength(200);
            entity.Property(i => i.UnitPrice).HasPrecision(18, 2);
            entity.Ignore(i => i.LineTotal);

            var guidListConverter = new ValueConverter<List<Guid>?, string?>(
                v => v == null ? null : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => v == null ? null : JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null)
            );

            var guidListComparer = new ValueComparer<List<Guid>?>(
                (l, r) => (l == null && r == null) || (l != null && r != null && l.SequenceEqual(r)),
                v => v == null ? 0 : v.Aggregate(0, (a, g) => HashCode.Combine(a, g.GetHashCode())),
                v => v == null ? null : v.ToList()
            );

            entity.Property(i => i.SharedWithParticipantIds)
                  .HasConversion(guidListConverter, guidListComparer)
                  .HasColumnName("SharedWithParticipantIds");
        });
    }
}
