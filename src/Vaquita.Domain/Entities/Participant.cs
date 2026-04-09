using Vaquita.Domain.Enums;

namespace Vaquita.Domain.Entities;

public class Participant
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string UniqueToken { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public List<ConsumptionItem> Items { get; set; } = [];

    public Event Event { get; set; } = null!;
}
