using Microsoft.EntityFrameworkCore;
using Vaquita.Domain.Entities;
using Vaquita.Domain.Interfaces;
using Vaquita.Infrastructure.Data;

namespace Vaquita.Infrastructure.Repositories;

public class EventRepository(AppDbContext context) : IEventRepository
{
    public async Task<Event?> GetByIdAsync(Guid id)
    {
        return await context.Events
            .Include(e => e.Participants)
                .ThenInclude(p => p.Items)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Event?> GetByIdWithAdminCodeAsync(Guid id, string adminCode)
    {
        var ev = await context.Events
            .Include(e => e.Participants)
                .ThenInclude(p => p.Items)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (ev == null || ev.AdminCode != adminCode)
            return null;

        return ev;
    }

    public async Task<Participant?> GetParticipantByTokenAsync(string token)
    {
        return await context.Participants
            .Include(p => p.Items)
            .Include(p => p.Event)
                .ThenInclude(e => e.Participants)
            .FirstOrDefaultAsync(p => p.UniqueToken == token);
    }

    public async Task<Participant?> GetParticipantByIdAsync(Guid participantId)
    {
        return await context.Participants
            .Include(p => p.Items)
            .Include(p => p.Event)
                .ThenInclude(e => e.Participants)
                    .ThenInclude(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == participantId);
    }

    public async Task<ConsumptionItem?> GetItemByIdAsync(Guid itemId)
    {
        return await context.ConsumptionItems
            .Include(i => i.Participant)
                .ThenInclude(p => p.Event)
                    .ThenInclude(e => e.Participants)
                        .ThenInclude(p => p.Items)
            .FirstOrDefaultAsync(i => i.Id == itemId);
    }

    public async Task<Event> CreateAsync(Event ev)
    {
        context.Events.Add(ev);
        await context.SaveChangesAsync();
        return ev;
    }

    public async Task UpdateAsync(Event ev)
    {
        // Entity is always loaded (tracked) before calling UpdateAsync,
        // so EF Core already tracks all changes including new child entities.
        // Calling context.Events.Update() on an already-tracked entity would
        // incorrectly change newly-added children (e.g. ConsumptionItem) from
        // EntityState.Added to EntityState.Modified, causing INSERT to fail.
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var ev = await context.Events.FindAsync(id);
        if (ev != null)
        {
            context.Events.Remove(ev);
            await context.SaveChangesAsync();
        }
    }

    public async Task<List<Event>> GetExpiredEventsAsync()
    {
        return await context.Events
            .Where(e => e.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();
    }
}
