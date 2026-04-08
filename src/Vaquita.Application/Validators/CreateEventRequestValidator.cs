using FluentValidation;
using Vaquita.Application.DTOs;
using Vaquita.Domain.Enums;

namespace Vaquita.Application.Validators;

public class CreateEventRequestValidator : AbstractValidator<CreateEventRequest>
{
    public CreateEventRequestValidator()
    {
        RuleFor(x => x.EventName)
            .NotEmpty().WithMessage("El nombre del evento es requerido")
            .MaximumLength(100);

        RuleFor(x => x.OrganizerName)
            .NotEmpty().WithMessage("El nombre del organizador es requerido")
            .MaximumLength(100);

        RuleFor(x => x.TotalAmount)
            .GreaterThan(0).When(x => x.SplitMode != SplitMode.ByConsumption)
            .WithMessage("El monto total debe ser mayor a 0")
            .LessThanOrEqualTo(99_999_999);

        RuleFor(x => x.TipPercentage)
            .InclusiveBetween(0, 50).WithMessage("La propina debe estar entre 0% y 50%");

        RuleFor(x => x.Participants)
            .NotEmpty().WithMessage("Debe haber al menos un participante")
            .Must(p => p.Count <= 50).WithMessage("Máximo 50 participantes");

        RuleForEach(x => x.Participants).ChildRules(p =>
        {
            p.RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            p.RuleFor(x => x.Amount)
                .GreaterThanOrEqualTo(0)
                .LessThanOrEqualTo(99_999_999);
        });

        RuleFor(x => x.PaymentInfo).NotNull();
        RuleFor(x => x.PaymentInfo.BankName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PaymentInfo.AccountType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.PaymentInfo.AccountNumber).NotEmpty().MaximumLength(30);
        RuleFor(x => x.PaymentInfo.Rut)
            .NotEmpty()
            .Matches(@"^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$")
            .WithMessage("Formato de RUT inválido. Use: 12.345.678-9");
        RuleFor(x => x.PaymentInfo.HolderName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PaymentInfo.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("Email inválido")
            .MaximumLength(100);
    }
}

public class AddConsumptionItemRequestValidator : AbstractValidator<AddConsumptionItemRequest>
{
    public AddConsumptionItemRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().MaximumLength(200)
            .WithMessage("La descripción es requerida");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("El precio debe ser mayor a 0")
            .LessThanOrEqualTo(99_999_999);

        RuleFor(x => x.Quantity)
            .InclusiveBetween(1, 100).WithMessage("La cantidad debe estar entre 1 y 100");
    }
}
