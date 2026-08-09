using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.DTOs;
using QANgalleryServer.Services;

namespace QANgalleryServer.Endpoints;

public static class GalleryEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/gallery");

        // GET /api/gallery?tab=works|characters|parts&search=&tags=&category=&page=&pageSize=
        group.MapGet("/", async (
            AppDbContext db,
            string? tab,
            string? search,
            string? tags,
            string? category,
            int page = 1,
            int pageSize = 20) =>
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var tagList = (tags ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => t.ToLowerInvariant())
                .Distinct()
                .ToList();

            return tab switch
            {
                "characters" => await BrowseCharactersAsync(db, search, tagList, page, pageSize),
                "parts" => await BrowsePartsAsync(db, search, tagList, category, page, pageSize),
                _ => await BrowseWorksAsync(db, search, tagList, page, pageSize)
            };
        });
    }

    private static async Task<IResult> BrowseWorksAsync(
        AppDbContext db, string? search, List<string> tagList, int page, int pageSize)
    {
        var query = db.Works
            .Include(w => w.User)
            .Include(w => w.MediaItems)
            .Include(w => w.WorkTags).ThenInclude(wt => wt.Tag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(w =>
                w.Title.Contains(s) ||
                w.Prompt.Contains(s) ||
                (w.Intro != null && w.Intro.Contains(s)));
        }

        foreach (var tag in tagList)
        {
            query = query.Where(w => w.WorkTags.Any(wt => wt.Tag!.Name.ToLower() == tag));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(w => w.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var list = items.Select(WorksEndpoints.BuildListItem).Cast<object>().ToList();
        return Results.Ok(new PagedResponse<object>(list, total, page, pageSize, page * pageSize < total));
    }

    private static async Task<IResult> BrowseCharactersAsync(
        AppDbContext db, string? search, List<string> tagList, int page, int pageSize)
    {
        var query = db.Characters
            .Include(c => c.CharacterTags).ThenInclude(ct => ct.Tag)
            .Include(c => c.CharacterWorks)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(c =>
                c.Name.Contains(s) ||
                c.Prompt.Contains(s) ||
                (c.Intro != null && c.Intro.Contains(s)));
        }

        foreach (var tag in tagList)
        {
            query = query.Where(c => c.CharacterTags.Any(ct => ct.Tag!.Name.ToLower() == tag));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var list = items.Select(c =>
        {
            var tags = c.CharacterTags.Select(ct => ct.Tag!.Name).OrderBy(n => n).ToList();
            return (object)new CharacterListItem(
                c.Id,
                c.Name,
                c.Intro,
                c.PreviewFileName != null ? MediaPaths.CharacterUrl(c.Id, c.PreviewFileName) : null,
                tags,
                c.CharacterWorks.Count,
                c.CreatedAt);
        }).ToList();

        return Results.Ok(new PagedResponse<object>(list, total, page, pageSize, page * pageSize < total));
    }

    private static async Task<IResult> BrowsePartsAsync(
        AppDbContext db, string? search, List<string> tagList, string? category, int page, int pageSize)
    {
        var query = db.Parts
            .Include(p => p.PartTags).ThenInclude(pt => pt.Tag)
            .Include(p => p.WorkParts)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var cat = category.Trim();
            query = query.Where(p => p.Category == cat);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(p =>
                p.Name.Contains(s) ||
                p.Prompt.Contains(s) ||
                (p.Intro != null && p.Intro.Contains(s)));
        }

        foreach (var tag in tagList)
        {
            query = query.Where(p => p.PartTags.Any(pt => pt.Tag!.Name.ToLower() == tag));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var list = items.Select(p =>
        {
            var tags = p.PartTags.Select(pt => pt.Tag!.Name).OrderBy(n => n).ToList();
            return (object)new PartListItem(
                p.Id,
                p.Name,
                p.Category,
                p.Intro,
                p.PreviewFileName != null ? MediaPaths.PartUrl(p.Id, p.PreviewFileName) : null,
                tags,
                p.WorkParts.Count,
                p.CreatedAt);
        }).ToList();

        return Results.Ok(new PagedResponse<object>(list, total, page, pageSize, page * pageSize < total));
    }
}
