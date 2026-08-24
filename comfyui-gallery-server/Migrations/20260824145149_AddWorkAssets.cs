using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QANgalleryServer.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkAssets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkAssets",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    WorkId = table.Column<string>(type: "TEXT", nullable: false),
                    AssetType = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    OriginalName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    PreviewFileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    Size = table.Column<long>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkAssets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkAssets_Works_WorkId",
                        column: x => x.WorkId,
                        principalTable: "Works",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkAssets_WorkId_SortOrder",
                table: "WorkAssets",
                columns: new[] { "WorkId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkAssets");
        }
    }
}
