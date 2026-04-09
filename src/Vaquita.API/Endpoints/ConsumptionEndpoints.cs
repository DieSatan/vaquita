using Vaquita.Application.DTOs;
using Vaquita.Application.Interfaces;
using Vaquita.Application.Validators;

namespace Vaquita.API.Endpoints;

public static class ConsumptionEndpoints
{
    public static IEndpointRouteBuilder MapConsumptionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/participants").WithTags("Consumption");

        group.MapPost("/{token}/items", async (string token, AddConsumptionItemRequest request, IEventService service) =>
        {
            var validator = new AddConsumptionItemRequestValidator();
            var validation = await validator.ValidateAsync(request);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            var result = await service.AddItemAsync(token, request);
            if (result == null)
                return Results.Json(new { message = "No se pudo agregar el item" }, statusCode: 400);

            return Results.Ok(result);
        });

        group.MapPut("/{token}/items/{itemId:guid}", async (string token, Guid itemId, AddConsumptionItemRequest request, IEventService service) =>
        {
            var validator = new AddConsumptionItemRequestValidator();
            var validation = await validator.ValidateAsync(request);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            var result = await service.UpdateItemAsync(token, itemId, request);
            if (result == null)
                return Results.Json(new { message = "No se pudo actualizar el item" }, statusCode: 400);

            return Results.Ok(result);
        });

        group.MapDelete("/{token}/items/{itemId:guid}", async (string token, Guid itemId, IEventService service) =>
        {
            var result = await service.DeleteItemAsync(token, itemId);
            if (result == null)
                return Results.Json(new { message = "No se pudo eliminar el item" }, statusCode: 400);

            return Results.Ok(result);
        });

        return app;
    }
}
