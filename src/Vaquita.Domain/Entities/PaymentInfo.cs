namespace Vaquita.Domain.Entities;

public class PaymentInfo
{
    public string BankName { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string Rut { get; set; } = string.Empty;
    public string HolderName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
