namespace Vaquita.Domain.Entities;

public class ConsumptionItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ParticipantId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public bool IsShared { get; set; }
    public List<Guid>? SharedWithParticipantIds { get; set; }

    public Participant Participant { get; set; } = null!;

    public decimal LineTotal => UnitPrice * Quantity;
}
