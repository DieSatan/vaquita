using Vaquita.Domain.Entities;

namespace Vaquita.Domain.Interfaces;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(Guid id);
    Task<Event?> GetByIdWithAdminCodeAsync(Guid id, string adminCode);
    Task<Participant?> GetParticipantByTokenAsync(string token);
    Task<Participant?> GetParticipantByIdAsync(Guid participantId);
    Task<ConsumptionItem?> GetItemByIdAsync(Guid itemId);
    Task<Event> CreateAsync(Event ev);
    Task UpdateAsync(Event ev);
    Task DeleteAsync(Guid id);
    Task<List<Event>> GetExpiredEventsAsync();
}
