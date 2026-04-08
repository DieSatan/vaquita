using FluentValidation;
using Vaquita.Application.DTOs;
using Vaquita.Application.Interfaces;
using Vaquita.Application.Validators;

namespace Vaquita.API.Endpoints;

public static class EventEndpoints
{
    public static IEndpointRouteBuilder MapEventEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/events").WithTags("Events");

        group.MapPost("/", async (CreateEventRequest request, IEventService service) =>
        {
            var validator = new CreateEventRequestValidator();
            var validation = await validator.ValidateAsync(request);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            var result = await service.CreateEventAsync(request);
            return Results.Created($"/api/events/{result.Id}", result);
        })
        .RequireRateLimiting("create");

        group.MapGet("/{id:guid}", async (Guid id, HttpContext ctx, IEventService service) =>
        {
            var adminCode = ctx.Request.Headers["X-Admin-Code"].FirstOrDefault();
            if (string.IsNullOrEmpty(adminCode))
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            var result = await service.GetEventDashboardAsync(id, adminCode);
            if (result == null)
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            return Results.Ok(result);
        })
        .RequireRateLimiting("admin");

        group.MapGet("/{id:guid}/summary", async (Guid id, HttpContext ctx, IEventService service) =>
        {
            var adminCode = ctx.Request.Headers["X-Admin-Code"].FirstOrDefault();
            if (string.IsNullOrEmpty(adminCode))
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            var result = await service.GetEventSummaryAsync(id, adminCode);
            if (result == null)
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            return Results.Ok(result);
        })
        .RequireRateLimiting("admin");

        group.MapPost("/{id:guid}/lock", async (Guid id, LockEventRequest? request, HttpContext ctx, IEventService service) =>
        {
            var adminCode = ctx.Request.Headers["X-Admin-Code"].FirstOrDefault();
            if (string.IsNullOrEmpty(adminCode))
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            var tipPercentage = request?.TipPercentage ?? 0;
            var result = await service.LockEventAsync(id, adminCode, tipPercentage);
            if (result == null)
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            return Results.Ok(result);
        })
        .RequireRateLimiting("admin");

        group.MapPost("/{id:guid}/remind/{participantId:guid}", async (Guid id, Guid participantId, HttpContext ctx, IEventService service) =>
        {
            var adminCode = ctx.Request.Headers["X-Admin-Code"].FirstOrDefault();
            if (string.IsNullOrEmpty(adminCode))
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            var url = await service.GenerateReminderUrlAsync(id, participantId, adminCode);
            if (url == null)
                return Results.Json(new { message = "No se pudo generar el recordatorio" }, statusCode: 400);

            return Results.Ok(new { whatsappUrl = url });
        })
        .RequireRateLimiting("admin");

        group.MapDelete("/{id:guid}", async (Guid id, HttpContext ctx, IEventService service) =>
        {
            var adminCode = ctx.Request.Headers["X-Admin-Code"].FirstOrDefault();
            if (string.IsNullOrEmpty(adminCode))
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            var deleted = await service.DeleteEventAsync(id, adminCode);
            if (!deleted)
                return Results.Json(new { message = "Evento no encontrado o código incorrecto" }, statusCode: 401);

            return Results.NoContent();
        })
        .RequireRateLimiting("admin");

        return app;
    }
}

public class LockEventRequest
{
    public decimal TipPercentage { get; set; }
}
