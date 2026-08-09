using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.DTOs;
using QANgalleryServer.Models;
using QANgalleryServer.Services;

namespace QANgalleryServer.Endpoints;

public static class CharactersEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/characters");

        // GET /api/characters/all — 全部角色轻量列表(供选择器)
        group.MapGet("/all", async (AppDbContext db) =>
        {
            var list = await db.Characters
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CharacterRef(
                    c.Id,
                    c.Name,
                    c.PreviewFileName != null ? MediaPaths.CharacterUrl(c.Id, c.PreviewFileName) : null))
                .ToListAsync();
            return Results.Ok(list);
        });

        // ─── 创建角色 ───
        group.MapPost("/", async (
            HttpContext http,
            AppDbContext db,
            CharacterCreateRequest req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "名称不能为空且不超过 100 字符" });
            if (string.IsNullOrWhiteSpace(req.Prompt))
                return Results.BadRequest(new { error = "角色设定 prompt 不能为空" });

            var character = new Character
            {
                UserId = userId,
                Name = req.Name.Trim(),
                Prompt = req.Prompt.Trim(),
                Intro = req.Intro
            };
            db.Characters.Add(character);
            await db.SaveChangesAsync();

            await TagService.ReplaceCharacterTagsAsync(db, character.Id, req.Tags);

            return Results.Ok(new { id = character.Id });
        }).RequireAuthorization();

        // ─── 角色详情(含合集作品) ───
        group.MapGet("/{id}", async (AppDbContext db, string id) =>
        {
            var character = await db.Characters
                .Include(c => c.User)
                .Include(c => c.CharacterTags).ThenInclude(ct => ct.Tag)
                .Include(c => c.CharacterWorks).ThenInclude(cw => cw.Work)
                    .ThenInclude(w => w!.MediaItems)
                .Include(c => c.CharacterWorks).ThenInclude(cw => cw.Work)
                    .ThenInclude(w => w!.WorkTags).ThenInclude(wt => wt.Tag)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (character == null) return Results.NotFound();

            var works = new List<WorkListItem>();
            foreach (var cw in character.CharacterWorks)
            {
                if (cw.Work == null) continue;
                works.Add(WorksEndpoints.BuildListItem(cw.Work));
            }
            works = works.OrderByDescending(w => w.CreatedAt).ToList();

            var tags = character.CharacterTags.Select(ct => ct.Tag!.Name).OrderBy(n => n).ToList();
            return Results.Ok(new CharacterDetail(
                character.Id,
                character.Name,
                character.Prompt,
                character.Intro,
                character.PreviewFileName != null
                    ? MediaPaths.CharacterUrl(character.Id, character.PreviewFileName)
                    : null,
                tags,
                works,
                new AuthorInfo(character.UserId, character.User?.UserName ?? ""),
                character.CreatedAt,
                character.UpdatedAt));
        });

        // ─── 更新角色 ───
        group.MapPut("/{id}", async (
            HttpContext http,
            AppDbContext db,
            string id,
            CharacterUpdateRequest req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var character = await db.Characters.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (character == null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 100)
                return Results.BadRequest(new { error = "名称不能为空且不超过 100 字符" });
            if (string.IsNullOrWhiteSpace(req.Prompt))
                return Results.BadRequest(new { error = "角色设定 prompt 不能为空" });

            character.Name = req.Name.Trim();
            character.Prompt = req.Prompt.Trim();
            character.Intro = req.Intro;
            character.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            await TagService.ReplaceCharacterTagsAsync(db, id, req.Tags);

            return Results.Ok(new { id });
        }).RequireAuthorization();

        // ─── 删除角色(不影响作品) ───
        group.MapDelete("/{id}", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var character = await db.Characters.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (character == null) return Results.NotFound();

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var dir = MediaPaths.CharacterDir(mediaRoot, id);
            if (Directory.Exists(dir))
                Directory.Delete(dir, recursive: true);

            db.Characters.Remove(character);
            await db.SaveChangesAsync();
            await TagService.RecomputeUsageAsync(db);

            return Results.Ok(new { deleted = true });
        }).RequireAuthorization();

        // ─── 上传/更换角色预览图 ───
        group.MapPost("/{id}/preview", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var character = await db.Characters.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (character == null) return Results.NotFound();

            var file = http.Request.Form.Files.FirstOrDefault();
            if (file == null)
                return Results.BadRequest(new { error = "未收到预览图" });
            if (UploadRules.DetectType(file.FileName) != "image")
                return Results.BadRequest(new { error = "预览图必须是图片" });
            if (file.Length > UploadRules.MaxImageSize)
                return Results.BadRequest(new { error = "预览图超过 50MB 限制" });

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var dir = MediaPaths.CharacterDir(mediaRoot, id);
            Directory.CreateDirectory(dir);

            if (!string.IsNullOrEmpty(character.PreviewFileName))
            {
                var oldPath = Path.Combine(dir, character.PreviewFileName);
                if (File.Exists(oldPath))
                    File.Delete(oldPath);
            }

            var storedName = $"preview_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(dir, storedName);
            await using (var stream = File.Create(fullPath))
                await file.CopyToAsync(stream);

            character.PreviewFileName = storedName;
            character.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { previewUrl = MediaPaths.CharacterUrl(id, storedName) });
        }).RequireAuthorization();

        // ─── 向合集追加作品 ───
        group.MapPost("/{id}/works", async (
            HttpContext http,
            AppDbContext db,
            string id,
            AddWorksRequest req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var character = await db.Characters.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (character == null) return Results.NotFound();

            var added = 0;
            foreach (var workId in (req.WorkIds ?? new()).Distinct())
            {
                var exists = await db.Works.AnyAsync(w => w.Id == workId);
                if (!exists) continue;
                var alreadyLinked = await db.CharacterWorks
                    .AnyAsync(cw => cw.CharacterId == id && cw.WorkId == workId);
                if (alreadyLinked) continue;
                db.CharacterWorks.Add(new CharacterWork { CharacterId = id, WorkId = workId });
                added++;
            }
            await db.SaveChangesAsync();
            return Results.Ok(new { added });
        }).RequireAuthorization();

        // ─── 从合集移除作品 ───
        group.MapDelete("/{id}/works/{workId}", async (
            HttpContext http,
            AppDbContext db,
            string id,
            string workId) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var character = await db.Characters.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (character == null) return Results.NotFound();

            var link = await db.CharacterWorks
                .FirstOrDefaultAsync(cw => cw.CharacterId == id && cw.WorkId == workId);
            if (link == null) return Results.NotFound();

            db.CharacterWorks.Remove(link);
            await db.SaveChangesAsync();
            return Results.Ok(new { removed = true });
        }).RequireAuthorization();
    }
}

public record AddWorksRequest(List<string>? WorkIds);
