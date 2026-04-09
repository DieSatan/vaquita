using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vaquita.Application.Interfaces;
using Vaquita.Domain.Interfaces;
using Vaquita.Infrastructure.Data;
using Vaquita.Infrastructure.Repositories;
using Vaquita.Infrastructure.Services;

namespace Vaquita.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection")
            ?? "Data Source=vaquita.db";

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(connectionString,
                o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

        services.AddScoped<IEventRepository, EventRepository>();

        var encryptionKey = config["Security:EncryptionKey"] ?? "dev-key-change-in-production";
        services.AddSingleton<IEncryptionService>(_ => new EncryptionService(encryptionKey));

        services.AddHostedService<CleanupService>();

        return services;
    }
}
