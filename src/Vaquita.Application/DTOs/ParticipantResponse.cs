using Vaquita.Domain.Enums;

namespace Vaquita.Application.DTOs;

public class ParticipantResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; }
    public string UniqueToken { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public List<ConsumptionItemDto> Items { get; set; } = [];
    public PaymentInfoDto? PaymentInfo { get; set; }
    public string? EventName { get; set; }
    public string? OrganizerName { get; set; }
    public bool IsEventLocked { get; set; }
    public string? SplitMode { get; set; }
    public List<OtherParticipantDto> OtherParticipants { get; set; } = [];
}

public class OtherParticipantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
