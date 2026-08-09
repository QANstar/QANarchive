using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.DTOs;

namespace QANgalleryServer.Endpoints;

public static class TagsEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/tags");

        // GET /api/tags/hot?limit=20 — 热门标签(按使用次数降序)
        group.MapGet("/hot", async (AppDbContext db, int limit = 20) =>
        {
            limit = Math.Clamp(limit, 1, 100);
            var tags = await db.Tags
                .Where(t => t.UsageCount > 0)
                .OrderByDescending(t => t.UsageCount)
                .ThenBy(t => t.Name)
                .Take(limit)
                .Select(t => new HotTagDto(t.Id, t.Name, t.UsageCount))
                .ToListAsync();
            return Results.Ok(tags);
        });
    }
}
