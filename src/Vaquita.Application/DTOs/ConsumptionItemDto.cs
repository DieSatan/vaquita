namespace Vaquita.Application.DTOs;

public class ConsumptionItemDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public bool IsShared { get; set; }
    public List<Guid>? SharedWithParticipantIds { get; set; }
    public decimal LineTotal { get; set; }
}

public class AddConsumptionItemRequest
{
    public string Description { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public bool IsShared { get; set; }
    public List<Guid>? SharedWithParticipantIds { get; set; }
}
