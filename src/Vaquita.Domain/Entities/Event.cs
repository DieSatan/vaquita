using Vaquita.Domain.Enums;

namespace Vaquita.Domain.Entities;

public class Event
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OrganizerName { get; set; } = string.Empty;
    public string EventName { get; set; } = string.Empty;
    public string AdminCode { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public SplitMode SplitMode { get; set; }
    public bool IsLocked { get; set; }
    public decimal TipPercentage { get; set; }
    public PaymentInfo PaymentInfo { get; set; } = new();
    public List<Participant> Participants { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    public Event()
    {
        ExpiresAt = CreatedAt.AddDays(7);
    }
}
