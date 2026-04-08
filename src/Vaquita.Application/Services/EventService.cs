using System.Security.Cryptography;
using Vaquita.Application.DTOs;
using Vaquita.Application.Interfaces;
using Vaquita.Domain.Entities;
using Vaquita.Domain.Enums;
using Vaquita.Domain.Interfaces;

namespace Vaquita.Application.Services;

public class EventService(IEventRepository repository, IEncryptionService encryption) : IEventService
{
    public async Task<EventResponse> CreateEventAsync(CreateEventRequest request)
    {
        var adminCode = GenerateAdminCode();
        var ev = new Event
        {
            EventName = request.EventName,
            OrganizerName = request.OrganizerName,
            AdminCode = adminCode,
            SplitMode = request.SplitMode,
            TipPercentage = request.TipPercentage,
            PaymentInfo = new PaymentInfo
            {
                BankName = request.PaymentInfo.BankName,
                AccountType = request.PaymentInfo.AccountType,
                AccountNumber = encryption.Encrypt(request.PaymentInfo.AccountNumber),
                Rut = encryption.Encrypt(request.PaymentInfo.Rut),
                HolderName = encryption.Encrypt(request.PaymentInfo.HolderName),
                Email = encryption.Encrypt(request.PaymentInfo.Email)
            }
        };

        if (request.SplitMode == SplitMode.Even)
        {
            ev.TotalAmount = request.TotalAmount;
            var perPerson = Math.Round(request.TotalAmount / request.Participants.Count, 0, MidpointRounding.AwayFromZero);
            foreach (var p in request.Participants)
            {
                ev.Participants.Add(new Participant
                {
                    Name = p.Name,
                    Phone = p.Phone,
                    Amount = perPerson,
                    UniqueToken = GenerateUniqueToken()
                });
            }
        }
        else if (request.SplitMode == SplitMode.Custom)
        {
            ev.TotalAmount = request.TotalAmount;
            foreach (var p in request.Participants)
            {
                ev.Participants.Add(new Participant
                {
                    Name = p.Name,
                    Phone = p.Phone,
                    Amount = p.Amount,
                    UniqueToken = GenerateUniqueToken()
                });
            }
        }
        else // ByConsumption
        {
            foreach (var p in request.Participants)
            {
                ev.Participants.Add(new Participant
                {
                    Name = p.Name,
                    Phone = p.Phone,
                    Amount = 0,
                    UniqueToken = GenerateUniqueToken()
                });
            }
        }

        var created = await repository.CreateAsync(ev);
        var response = MapToEventResponse(created);
        response.AdminCode = adminCode;
        return response;
    }

    public async Task<EventResponse?> GetEventDashboardAsync(Guid id, string adminCode)
    {
        var ev = await repository.GetByIdWithAdminCodeAsync(id, adminCode);
        if (ev == null) return null;
        return MapToEventResponse(ev);
    }

    public async Task<ParticipantResponse?> GetParticipantViewAsync(string token)
    {
        var participant = await repository.GetParticipantByTokenAsync(token);
        if (participant == null) return null;
        if (participant.Event.ExpiresAt < DateTime.UtcNow) return null;

        return MapToParticipantResponse(participant, includePaymentInfo: true);
    }

    public async Task<ParticipantResponse?> MarkPaidAsync(string token)
    {
        var participant = await repository.GetParticipantByTokenAsync(token);
        if (participant == null) return null;
        if (participant.Status != PaymentStatus.Pending) return MapToParticipantResponse(participant, false);

        participant.Status = PaymentStatus.MarkedAsPaid;
        participant.PaidAt = DateTime.UtcNow;
        await repository.UpdateAsync(participant.Event);
        return MapToParticipantResponse(participant, false);
    }

    public async Task<ParticipantResponse?> ConfirmPaymentAsync(Guid participantId, string adminCode)
    {
        var participant = await repository.GetParticipantByIdAsync(participantId);
        if (participant == null) return null;

        var ev = await repository.GetByIdWithAdminCodeAsync(participant.EventId, adminCode);
        if (ev == null) return null;

        var p = ev.Participants.FirstOrDefault(x => x.Id == participantId);
        if (p == null) return null;

        p.Status = PaymentStatus.Confirmed;
        await repository.UpdateAsync(ev);
        return MapToParticipantResponse(p, false);
    }

    public async Task<string?> GenerateReminderUrlAsync(Guid eventId, Guid participantId, string adminCode)
    {
        var ev = await repository.GetByIdWithAdminCodeAsync(eventId, adminCode);
        if (ev == null) return null;

        var participant = ev.Participants.FirstOrDefault(p => p.Id == participantId);
        if (participant == null) return null;

        var payLink = $"https://vaquita.onrender.com/pay/{participant.UniqueToken}";
        var amount = participant.Amount.ToString("N0");
        var message = Uri.EscapeDataString(
            $"Hola {participant.Name}! Te recuerdo que debes ${amount} para {ev.EventName}. " +
            $"Puedes ver los datos de pago aquí: {payLink}");

        if (string.IsNullOrEmpty(participant.Phone)) return null;

        var phone = participant.Phone.Replace("+", "").Replace(" ", "").Replace("-", "");
        if (!phone.StartsWith("56")) phone = "56" + phone.TrimStart('0');

        return $"https://wa.me/{phone}?text={message}";
    }

    public async Task<bool> DeleteEventAsync(Guid id, string adminCode)
    {
        var ev = await repository.GetByIdWithAdminCodeAsync(id, adminCode);
        if (ev == null) return false;
        await repository.DeleteAsync(id);
        return true;
    }

    public async Task<EventSummaryResponse?> GetEventSummaryAsync(Guid id, string adminCode)
    {
        var ev = await repository.GetByIdWithAdminCodeAsync(id, adminCode);
        if (ev == null) return null;

        return new EventSummaryResponse
        {
            EventId = ev.Id,
            TotalAmount = ev.TotalAmount,
            TipPercentage = ev.TipPercentage,
            IsLocked = ev.IsLocked,
            Participants = ev.Participants.Select(p => new ParticipantSummaryDto
            {
                Id = p.Id,
                Name = p.Name,
                Amount = p.Amount,
                Status = p.Status.ToString(),
                Items = p.Items.Select(MapToConsumptionItemDto).ToList()
            }).ToList()
        };
    }

    public async Task<EventResponse?> LockEventAsync(Guid id, string adminCode, decimal tipPercentage)
    {
        var ev = await repository.GetByIdWithAdminCodeAsync(id, adminCode);
        if (ev == null) return null;

        ev.IsLocked = true;
        ev.TipPercentage = tipPercentage;
        RecalculateAmounts(ev);
        await repository.UpdateAsync(ev);
        return MapToEventResponse(ev);
    }

    public async Task<ParticipantResponse?> AddItemAsync(string token, AddConsumptionItemRequest request)
    {
        var participant = await repository.GetParticipantByTokenAsync(token);
        if (participant == null) return null;
        if (participant.Event.IsLocked) return null;

        var item = new ConsumptionItem
        {
            ParticipantId = participant.Id,
            Description = request.Description,
            UnitPrice = request.UnitPrice,
            Quantity = request.Quantity,
            IsShared = request.IsShared,
            SharedWithParticipantIds = request.IsShared
                ? (request.SharedWithParticipantIds?.Any() == true
                    ? request.SharedWithParticipantIds
                    : [participant.Id])
                : null
        };

        participant.Items.Add(item);
        RecalculateAmounts(participant.Event);
        await repository.UpdateAsync(participant.Event);

        var updated = await repository.GetParticipantByTokenAsync(token);
        return updated == null ? null : MapToParticipantResponse(updated, true);
    }

    public async Task<ParticipantResponse?> UpdateItemAsync(string token, Guid itemId, AddConsumptionItemRequest request)
    {
        var participant = await repository.GetParticipantByTokenAsync(token);
        if (participant == null) return null;
        if (participant.Event.IsLocked) return null;

        var item = participant.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return null;

        item.Description = request.Description;
        item.UnitPrice = request.UnitPrice;
        item.Quantity = request.Quantity;
        item.IsShared = request.IsShared;
        item.SharedWithParticipantIds = request.IsShared
            ? (request.SharedWithParticipantIds?.Any() == true
                ? request.SharedWithParticipantIds
                : [participant.Id])
            : null;

        RecalculateAmounts(participant.Event);
        await repository.UpdateAsync(participant.Event);

        var updated = await repository.GetParticipantByTokenAsync(token);
        return updated == null ? null : MapToParticipantResponse(updated, true);
    }

    public async Task<ParticipantResponse?> DeleteItemAsync(string token, Guid itemId)
    {
        var participant = await repository.GetParticipantByTokenAsync(token);
        if (participant == null) return null;
        if (participant.Event.IsLocked) return null;

        var item = participant.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return null;

        participant.Items.Remove(item);
        RecalculateAmounts(participant.Event);
        await repository.UpdateAsync(participant.Event);

        var updated = await repository.GetParticipantByTokenAsync(token);
        return updated == null ? null : MapToParticipantResponse(updated, true);
    }

    public async Task<int> DeleteExpiredEventsAsync()
    {
        var expired = await repository.GetExpiredEventsAsync();
        foreach (var ev in expired)
            await repository.DeleteAsync(ev.Id);
        return expired.Count;
    }

    private void RecalculateAmounts(Event ev)
    {
        var participantTotals = ev.Participants.ToDictionary(p => p.Id, _ => 0m);

        foreach (var participant in ev.Participants)
        {
            foreach (var item in participant.Items)
            {
                var lineTotal = item.UnitPrice * item.Quantity;
                if (!item.IsShared || item.SharedWithParticipantIds == null || item.SharedWithParticipantIds.Count == 0)
                {
                    participantTotals[participant.Id] += lineTotal;
                }
                else
                {
                    var perPerson = lineTotal / item.SharedWithParticipantIds.Count;
                    foreach (var sharerId in item.SharedWithParticipantIds)
                    {
                        if (participantTotals.ContainsKey(sharerId))
                            participantTotals[sharerId] += perPerson;
                    }
                }
            }
        }

        var grandTotal = participantTotals.Values.Sum();
        var tipAmount = ev.TipPercentage > 0 && ev.Participants.Count > 0
            ? grandTotal * ev.TipPercentage / 100m / ev.Participants.Count
            : 0m;

        foreach (var participant in ev.Participants)
        {
            participant.Amount = Math.Round(participantTotals[participant.Id] + tipAmount, 0, MidpointRounding.AwayFromZero);
        }

        ev.TotalAmount = ev.Participants.Sum(p => p.Amount);
    }

    private EventResponse MapToEventResponse(Event ev)
    {
        var paymentInfo = DecryptPaymentInfo(ev.PaymentInfo);
        return new EventResponse
        {
            Id = ev.Id,
            EventName = ev.EventName,
            OrganizerName = ev.OrganizerName,
            TotalAmount = ev.TotalAmount,
            SplitMode = ev.SplitMode,
            IsLocked = ev.IsLocked,
            TipPercentage = ev.TipPercentage,
            PaymentInfo = paymentInfo,
            CreatedAt = ev.CreatedAt,
            ExpiresAt = ev.ExpiresAt,
            ConfirmedCount = ev.Participants.Count(p => p.Status == PaymentStatus.Confirmed),
            TotalParticipants = ev.Participants.Count,
            Participants = ev.Participants.Select(p => new ParticipantResponse
            {
                Id = p.Id,
                Name = p.Name,
                Phone = p.Phone,
                Amount = p.Amount,
                Status = p.Status,
                UniqueToken = p.UniqueToken,
                PaidAt = p.PaidAt,
                Items = p.Items.Select(MapToConsumptionItemDto).ToList()
            }).ToList()
        };
    }

    private ParticipantResponse MapToParticipantResponse(Participant p, bool includePaymentInfo)
    {
        var response = new ParticipantResponse
        {
            Id = p.Id,
            Name = p.Name,
            Phone = p.Phone,
            Amount = p.Amount,
            Status = p.Status,
            UniqueToken = p.UniqueToken,
            PaidAt = p.PaidAt,
            Items = p.Items.Select(MapToConsumptionItemDto).ToList(),
            EventName = p.Event.EventName,
            OrganizerName = p.Event.OrganizerName,
            IsEventLocked = p.Event.IsLocked,
            SplitMode = p.Event.SplitMode.ToString(),
            OtherParticipants = p.Event.Participants
                .Where(x => x.Id != p.Id)
                .Select(x => new OtherParticipantDto { Id = x.Id, Name = x.Name })
                .ToList()
        };

        if (includePaymentInfo)
            response.PaymentInfo = DecryptPaymentInfo(p.Event.PaymentInfo);

        return response;
    }

    private PaymentInfoDto DecryptPaymentInfo(PaymentInfo info)
    {
        return new PaymentInfoDto
        {
            BankName = info.BankName,
            AccountType = info.AccountType,
            AccountNumber = TryDecrypt(info.AccountNumber),
            Rut = TryDecrypt(info.Rut),
            HolderName = TryDecrypt(info.HolderName),
            Email = TryDecrypt(info.Email)
        };
    }

    private string TryDecrypt(string value)
    {
        try { return encryption.Decrypt(value); }
        catch { return value; }
    }

    private static ConsumptionItemDto MapToConsumptionItemDto(ConsumptionItem item) =>
        new()
        {
            Id = item.Id,
            Description = item.Description,
            UnitPrice = item.UnitPrice,
            Quantity = item.Quantity,
            IsShared = item.IsShared,
            SharedWithParticipantIds = item.SharedWithParticipantIds,
            LineTotal = item.UnitPrice * item.Quantity
        };

    private static string GenerateAdminCode() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(4));

    private static string GenerateUniqueToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(16))
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');
}
