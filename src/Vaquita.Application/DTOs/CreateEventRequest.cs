using Vaquita.Domain.Enums;

namespace Vaquita.Application.DTOs;

public class CreateEventRequest
{
    public string EventName { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;
    public SplitMode SplitMode { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TipPercentage { get; set; }
    public PaymentInfoDto PaymentInfo { get; set; } = new();
    public List<ParticipantInputDto> Participants { get; set; } = [];
}

public class ParticipantInputDto
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public decimal Amount { get; set; }
}
