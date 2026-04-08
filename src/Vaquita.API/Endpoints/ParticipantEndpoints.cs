using Vaquita.Application.Interfaces;

namespace Vaquita.API.Endpoints;

public static class ParticipantEndpoints
{
    public static IEndpointRouteBuilder MapParticipantEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/participants").WithTags("Participants");

        group.MapGet("/{token}", async (string token, IEventService service) =>
        {
            var result = await service.GetParticipantViewAsync(token);
            if (result == null)
                return Results.Json(new { message = "Link no válido o expirado" }, statusCode: 404);

            return Results.Ok(result);
        });

        group.MapPatch("/{token}/mark-paid", async (string token, IEventService service) =>
        {
            var result = await service.MarkPaidAsync(token);
            if (result == null)
                return Results.Json(new { message = "Link no válido" }, statusCode: 404);

            return Results.Ok(result);
        });

        group.MapPatch("/{participantId:guid}/confirm", async (Guid participantId, HttpContext ctx, IEventService service) =>
        {
            var adminCode = ctx.Request.Headers["X-Admin-Code"].FirstOrDefault();
            if (string.IsNullOrEmpty(adminCode))
                return Results.Json(new { message = "No autorizado" }, statusCode: 401);

            var result = await service.ConfirmPaymentAsync(participantId, adminCode);
            if (result == null)
                return Results.Json(new { message = "No autorizado" }, statusCode: 401);

            return Results.Ok(result);
        })
        .RequireRateLimiting("admin");

        return app;
    }
}
