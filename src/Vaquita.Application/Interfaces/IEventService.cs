using Vaquita.Application.DTOs;

namespace Vaquita.Application.Interfaces;

public interface IEventService
{
    Task<EventResponse> CreateEventAsync(CreateEventRequest request);
    Task<EventResponse?> GetEventDashboardAsync(Guid id, string adminCode);
    Task<ParticipantResponse?> GetParticipantViewAsync(string token);
    Task<ParticipantResponse?> MarkPaidAsync(string token);
    Task<ParticipantResponse?> ConfirmPaymentAsync(Guid participantId, string adminCode);
    Task<string?> GenerateReminderUrlAsync(Guid eventId, Guid participantId, string adminCode);
    Task<bool> DeleteEventAsync(Guid id, string adminCode);
    Task<EventSummaryResponse?> GetEventSummaryAsync(Guid id, string adminCode);
    Task<EventResponse?> LockEventAsync(Guid id, string adminCode, decimal tipPercentage);
    Task<ParticipantResponse?> AddItemAsync(string token, AddConsumptionItemRequest request);
    Task<ParticipantResponse?> UpdateItemAsync(string token, Guid itemId, AddConsumptionItemRequest request);
    Task<ParticipantResponse?> DeleteItemAsync(string token, Guid itemId);
    Task<int> DeleteExpiredEventsAsync();
}
