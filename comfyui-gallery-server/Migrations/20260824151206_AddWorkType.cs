using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QANgalleryServer.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Works",
                type: "TEXT",
                maxLength: 5,
                nullable: false,
                defaultValue: "2d");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Works");
        }
    }
}
