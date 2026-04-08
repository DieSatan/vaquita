using Vaquita.Domain.Enums;

namespace Vaquita.Application.DTOs;

public class EventResponse
{
    public Guid Id { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;
    public string? AdminCode { get; set; }
    public decimal TotalAmount { get; set; }
    public SplitMode SplitMode { get; set; }
    public bool IsLocked { get; set; }
    public decimal TipPercentage { get; set; }
    public PaymentInfoDto PaymentInfo { get; set; } = new();
    public List<ParticipantResponse> Participants { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int ConfirmedCount { get; set; }
    public int TotalParticipants { get; set; }
}

public class EventSummaryResponse
{
    public Guid EventId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TipPercentage { get; set; }
    public bool IsLocked { get; set; }
    public List<ParticipantSummaryDto> Participants { get; set; } = [];
}

public class ParticipantSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ConsumptionItemDto> Items { get; set; } = [];
}
