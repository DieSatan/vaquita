using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Vaquita.Application.Interfaces;

namespace Vaquita.Infrastructure.Services;

public class CleanupService(IServiceScopeFactory scopeFactory, ILogger<CleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var eventService = scope.ServiceProvider.GetRequiredService<IEventService>();
                var count = await eventService.DeleteExpiredEventsAsync();
                if (count > 0)
                    logger.LogInformation("Cleanup: deleted {Count} expired events", count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Cleanup service error");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}
