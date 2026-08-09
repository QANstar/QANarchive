using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.DTOs;
using QANgalleryServer.Models;
using QANgalleryServer.Services;

namespace QANgalleryServer.Endpoints;

public static class PartsEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/parts");

        // GET /api/parts/all — 全部部件轻量列表(供选择器)
        group.MapGet("/all", async (AppDbContext db) =>
        {
            var list = await db.Parts
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PartRef(
                    p.Id,
                    p.Name,
                    p.Category,
                    p.PreviewFileName != null ? MediaPaths.PartUrl(p.Id, p.PreviewFileName) : null))
                .ToListAsync();
            return Results.Ok(list);
        });

        // ─── 创建部件 ───
        group.MapPost("/", async (
            HttpContext http,
            AppDbContext db,
            PartCreateRequest req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(req.Category) || req.Category.Length > 50)
                return Results.BadRequest(new { error = "分类不能为空且不超过 50 字符" });
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "名称不能为空且不超过 100 字符" });
            if (string.IsNullOrWhiteSpace(req.Prompt))
                return Results.BadRequest(new { error = "prompt 不能为空" });

            var part = new Part
            {
                UserId = userId,
                Category = req.Category.Trim(),
                Name = req.Name.Trim(),
                Prompt = req.Prompt.Trim(),
                Intro = req.Intro
            };
            db.Parts.Add(part);
            await db.SaveChangesAsync();

            await TagService.ReplacePartTagsAsync(db, part.Id, req.Tags);

            return Results.Ok(new { id = part.Id });
        }).RequireAuthorization();

        // ─── 部件详情 ───
        group.MapGet("/{id}", async (AppDbContext db, string id) =>
        {
            var part = await db.Parts
                .Include(p => p.User)
                .Include(p => p.PartTags).ThenInclude(pt => pt.Tag)
                .Include(p => p.WorkParts)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (part == null) return Results.NotFound();

            var tags = part.PartTags.Select(pt => pt.Tag!.Name).OrderBy(n => n).ToList();
            return Results.Ok(new PartDetail(
                part.Id,
                part.Name,
                part.Category,
                part.Prompt,
                part.Intro,
                part.PreviewFileName != null
                    ? MediaPaths.PartUrl(part.Id, part.PreviewFileName)
                    : null,
                tags,
                part.WorkParts.Count,
                new AuthorInfo(part.UserId, part.User?.UserName ?? ""),
                part.CreatedAt,
                part.UpdatedAt));
        });

        // ─── 更新部件 ───
        group.MapPut("/{id}", async (
            HttpContext http,
            AppDbContext db,
            string id,
            PartUpdateRequest req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var part = await db.Parts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
            if (part == null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(req.Category) || req.Category.Length > 50)
                return Results.BadRequest(new { error = "分类不能为空且不超过 50 字符" });
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "名称不能为空且不超过 100 字符" });
            if (string.IsNullOrWhiteSpace(req.Prompt))
                return Results.BadRequest(new { error = "prompt 不能为空" });

            part.Category = req.Category.Trim();
            part.Name = req.Name.Trim();
            part.Prompt = req.Prompt.Trim();
            part.Intro = req.Intro;
            part.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            await TagService.ReplacePartTagsAsync(db, id, req.Tags);

            return Results.Ok(new { id });
        }).RequireAuthorization();

        // ─── 删除部件(不影响作品) ───
        group.MapDelete("/{id}", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var part = await db.Parts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
            if (part == null) return Results.NotFound();

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var dir = MediaPaths.PartDir(mediaRoot, id);
            if (Directory.Exists(dir))
                Directory.Delete(dir, recursive: true);

            db.Parts.Remove(part);
            await db.SaveChangesAsync();
            await TagService.RecomputeUsageAsync(db);

            return Results.Ok(new { deleted = true });
        }).RequireAuthorization();

        // ─── 上传/更换部件预览图 ───
        group.MapPost("/{id}/preview", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var part = await db.Parts.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
            if (part == null) return Results.NotFound();

            var file = http.Request.Form.Files.FirstOrDefault();
            if (file == null)
                return Results.BadRequest(new { error = "未收到预览图" });
            if (UploadRules.DetectType(file.FileName) != "image")
                return Results.BadRequest(new { error = "预览图必须是图片" });
            if (file.Length > UploadRules.MaxImageSize)
                return Results.BadRequest(new { error = "预览图超过 50MB 限制" });

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var dir = MediaPaths.PartDir(mediaRoot, id);
            Directory.CreateDirectory(dir);

            if (!string.IsNullOrEmpty(part.PreviewFileName))
            {
                var oldPath = Path.Combine(dir, part.PreviewFileName);
                if (File.Exists(oldPath))
                    File.Delete(oldPath);
            }

            var storedName = $"preview_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(dir, storedName);
            await using (var stream = File.Create(fullPath))
                await file.CopyToAsync(stream);

            part.PreviewFileName = storedName;
            part.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { previewUrl = MediaPaths.PartUrl(id, storedName) });
        }).RequireAuthorization();
    }
}
