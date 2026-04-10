using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vaquita.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizerName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EventName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AdminCode = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    SplitMode = table.Column<int>(type: "integer", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false),
                    TipPercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    PaymentInfo_BankName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PaymentInfo_AccountType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PaymentInfo_AccountNumber = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PaymentInfo_Rut = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PaymentInfo_HolderName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PaymentInfo_Email = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Participants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    UniqueToken = table.Column<string>(type: "character varying(22)", maxLength: 22, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Participants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Participants_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ConsumptionItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    IsShared = table.Column<bool>(type: "boolean", nullable: false),
                    SharedWithParticipantIds = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsumptionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsumptionItems_Participants_ParticipantId",
                        column: x => x.ParticipantId,
                        principalTable: "Participants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConsumptionItems_ParticipantId",
                table: "ConsumptionItems",
                column: "ParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_Participants_EventId",
                table: "Participants",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Participants_UniqueToken",
                table: "Participants",
                column: "UniqueToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsumptionItems");

            migrationBuilder.DropTable(
                name: "Participants");

            migrationBuilder.DropTable(
                name: "Events");
        }
    }
}
