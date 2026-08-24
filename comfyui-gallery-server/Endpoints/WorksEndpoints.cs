using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.DTOs;
using QANgalleryServer.Models;
using QANgalleryServer.Services;

namespace QANgalleryServer.Endpoints;

public static class WorksEndpoints
{
    private const int MaxWorkflowJsonLength = 1024 * 1024; // 1MB

    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/works");

        // ─── 创建作品 ───
        group.MapPost("/", async (
            HttpContext http,
            AppDbContext db,
            WorkCreateRequest req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 100)
                return Results.BadRequest(new { error = "标题不能为空且不超过 100 字符" });
            var type = NormalizeType(req.Type);
            if (type == "2d" && string.IsNullOrWhiteSpace(req.Prompt))
                return Results.BadRequest(new { error = "prompt 不能为空" });
            if (!string.IsNullOrEmpty(req.WorkflowJson) && req.WorkflowJson.Length > MaxWorkflowJsonLength)
                return Results.BadRequest(new { error = "工作流 JSON 超过 1MB 限制" });

            var work = new Work
            {
                UserId = userId,
                Title = req.Title.Trim(),
                Type = type,
                Prompt = (req.Prompt ?? "").Trim(),
                Intro = req.Intro,
                WorkflowJson = req.WorkflowJson
            };
            db.Works.Add(work);
            await db.SaveChangesAsync();

            // 角色关联
            if (req.CharacterIds != null && req.CharacterIds.Count > 0)
            {
                var validIds = req.CharacterIds.Distinct().ToList();
                var existingChars = await db.Characters
                    .Where(c => validIds.Contains(c.Id))
                    .Select(c => c.Id)
                    .ToListAsync();
                foreach (var cid in existingChars)
                    db.CharacterWorks.Add(new CharacterWork { CharacterId = cid, WorkId = work.Id });
                await db.SaveChangesAsync();
            }

            // 部件关联
            if (req.PartIds != null && req.PartIds.Count > 0)
            {
                var validIds = req.PartIds.Distinct().ToList();
                var existingParts = await db.Parts
                    .Where(p => validIds.Contains(p.Id))
                    .Select(p => p.Id)
                    .ToListAsync();
                foreach (var pid in existingParts)
                    db.WorkParts.Add(new WorkPart { WorkId = work.Id, PartId = pid });
                await db.SaveChangesAsync();
            }

            // 标签
            await TagService.ReplaceWorkTagsAsync(db, work.Id, req.Tags);

            return Results.Ok(new { id = work.Id });
        }).RequireAuthorization();

        // ─── 作品详情 ───
        group.MapGet("/{id}", async (AppDbContext db, string id) =>
        {
            var work = await db.Works
                .Include(w => w.User)
                .Include(w => w.MediaItems)
                .Include(w => w.Assets)
                .Include(w => w.WorkTags).ThenInclude(wt => wt.Tag)
                .Include(w => w.CharacterWorks).ThenInclude(cw => cw.Character)
                .Include(w => w.WorkParts).ThenInclude(wp => wp.Part)
                .AsSplitQuery()
                .FirstOrDefaultAsync(w => w.Id == id);
            if (work == null) return Results.NotFound();

            return Results.Ok(BuildDetail(work));
        });

        // ─── 更新作品 ───
        group.MapPut("/{id}", async (
            HttpContext http,
            AppDbContext db,
            string id,
            WorkUpdateRequest req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 100)
                return Results.BadRequest(new { error = "标题不能为空且不超过 100 字符" });
            var type = NormalizeType(req.Type);
            if (type == "2d" && string.IsNullOrWhiteSpace(req.Prompt))
                return Results.BadRequest(new { error = "prompt 不能为空" });
            if (type == "2d" && await db.WorkAssets.AnyAsync(a => a.WorkId == id))
                return Results.BadRequest(new { error = "该作品已有 3D 资源,无法改为 2D;请先删除 3D 资源" });
            if (!string.IsNullOrEmpty(req.WorkflowJson) && req.WorkflowJson.Length > MaxWorkflowJsonLength)
                return Results.BadRequest(new { error = "工作流 JSON 超过 1MB 限制" });

            work.Title = req.Title.Trim();
            work.Type = type;
            work.Prompt = (req.Prompt ?? "").Trim();
            work.Intro = req.Intro;
            work.WorkflowJson = req.WorkflowJson;
            work.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            // 整组替换角色关联
            var oldCw = await db.CharacterWorks.Where(cw => cw.WorkId == id).ToListAsync();
            db.CharacterWorks.RemoveRange(oldCw);
            await db.SaveChangesAsync();
            if (req.CharacterIds != null)
            {
                var existingChars = await db.Characters
                    .Where(c => req.CharacterIds.Distinct().Contains(c.Id))
                    .Select(c => c.Id)
                    .ToListAsync();
                foreach (var cid in existingChars)
                    db.CharacterWorks.Add(new CharacterWork { CharacterId = cid, WorkId = id });
                await db.SaveChangesAsync();
            }

            // 整组替换部件关联
            var oldWp = await db.WorkParts.Where(wp => wp.WorkId == id).ToListAsync();
            db.WorkParts.RemoveRange(oldWp);
            await db.SaveChangesAsync();
            if (req.PartIds != null)
            {
                var existingParts = await db.Parts
                    .Where(p => req.PartIds.Distinct().Contains(p.Id))
                    .Select(p => p.Id)
                    .ToListAsync();
                foreach (var pid in existingParts)
                    db.WorkParts.Add(new WorkPart { WorkId = id, PartId = pid });
                await db.SaveChangesAsync();
            }

            // 整组替换标签
            await TagService.ReplaceWorkTagsAsync(db, id, req.Tags);

            return Results.Ok(new { id });
        }).RequireAuthorization();

        // ─── 删除作品 ───
        group.MapDelete("/{id}", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var dir = MediaPaths.WorkDir(mediaRoot, id);
            if (Directory.Exists(dir))
                Directory.Delete(dir, recursive: true);

            var assetsRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:AssetsDir") ?? "storage/assets");
            var assetDir = Path.Combine(assetsRoot, "works", id);
            if (Directory.Exists(assetDir))
                Directory.Delete(assetDir, recursive: true);

            db.Works.Remove(work);
            await db.SaveChangesAsync();
            await TagService.RecomputeUsageAsync(db);

            return Results.Ok(new { deleted = true });
        }).RequireAuthorization();

        // ─── 上传作品媒体(多文件) ───
        group.MapPost("/{id}/media", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            var files = http.Request.Form.Files;
            if (files.Count == 0)
                return Results.BadRequest(new { error = "未收到文件" });

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var dir = MediaPaths.WorkDir(mediaRoot, id);
            Directory.CreateDirectory(dir);

            var nextOrder = await db.Medias
                .Where(m => m.WorkId == id)
                .Select(m => (int?)m.SortOrder)
                .MaxAsync() ?? -1;

            var saved = new List<MediaDto>();
            foreach (var file in files)
            {
                var type = UploadRules.DetectType(file.FileName);
                if (type == "unknown")
                    return Results.BadRequest(new { error = $"不支持的文件类型: {file.FileName}" });
                if (type == "image" && file.Length > UploadRules.MaxImageSize)
                    return Results.BadRequest(new { error = $"图片超过 50MB 限制: {file.FileName}" });
                if (type == "video" && file.Length > UploadRules.MaxVideoSize)
                    return Results.BadRequest(new { error = $"视频超过 500MB 限制: {file.FileName}" });

                var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
                var fullPath = Path.Combine(dir, storedName);
                await using (var stream = File.Create(fullPath))
                    await file.CopyToAsync(stream);

                nextOrder++;
                var media = new Media
                {
                    WorkId = id,
                    FileName = storedName,
                    Type = type,
                    SortOrder = nextOrder,
                    Size = file.Length
                };
                db.Medias.Add(media);
                saved.Add(new MediaDto(media.Id, MediaPaths.WorkUrl(id, storedName), type, nextOrder, file.Length));
            }
            await db.SaveChangesAsync();

            return Results.Ok(saved);
        }).RequireAuthorization();

        // ─── 删除单个媒体 ───
        group.MapDelete("/{id}/media/{mediaId}", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id,
            string mediaId) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            var media = await db.Medias.FirstOrDefaultAsync(m => m.Id == mediaId && m.WorkId == id);
            if (media == null) return Results.NotFound();

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var fullPath = Path.Combine(MediaPaths.WorkDir(mediaRoot, id), media.FileName);
            if (File.Exists(fullPath))
                File.Delete(fullPath);

            // 若删除的是显式封面,清空封面
            if (work.CoverFileName == media.FileName)
            {
                work.CoverFileName = null;
            }

            db.Medias.Remove(media);
            await db.SaveChangesAsync();

            return Results.Ok(new { deleted = true });
        }).RequireAuthorization();

        // ─── 调整媒体顺序 ───
        group.MapPut("/{id}/media/order", async (
            HttpContext http,
            AppDbContext db,
            string id,
            List<MediaOrderItem> req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            foreach (var item in req)
            {
                var media = await db.Medias.FirstOrDefaultAsync(m => m.Id == item.MediaId && m.WorkId == id);
                if (media != null)
                    media.SortOrder = item.SortOrder;
            }
            await db.SaveChangesAsync();
            return Results.Ok(new { updated = true });
        }).RequireAuthorization();

        // ─── 上传 3D 资源(源文件 + 配对预览图) ───
        group.MapPost("/{id}/assets", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            if (NormalizeType(work.Type) == "2d")
                return Results.BadRequest(new { error = "2D 作品不能添加 3D 资源" });

            var assetFile = http.Request.Form.Files.FirstOrDefault(f => f.Name == "asset")
                ?? http.Request.Form.Files.FirstOrDefault();
            if (assetFile == null)
                return Results.BadRequest(new { error = "未收到 3D 资源文件" });

            var assetType = UploadRules.DetectAssetType(assetFile.FileName);
            if (assetType == "unknown")
                return Results.BadRequest(new { error = $"不支持的 3D 资源类型: {assetFile.FileName}(仅支持 fbx / blend / zip)" });
            if (assetFile.Length > UploadRules.MaxAssetSize(assetType))
                return Results.BadRequest(new { error = $"{assetType} 资源超过大小限制: {assetFile.FileName}" });

            var assetsRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:AssetsDir") ?? "storage/assets");

            var asset = new WorkAsset
            {
                WorkId = id,
                AssetType = assetType,
                OriginalName = Path.GetFileName(assetFile.FileName)
            };
            var sourceDir = MediaPaths.AssetSourceDir(assetsRoot, id, asset.Id);
            Directory.CreateDirectory(sourceDir);
            var sourceName = $"{Guid.NewGuid():N}{Path.GetExtension(assetFile.FileName)}";
            await using (var stream = File.Create(Path.Combine(sourceDir, sourceName)))
                await assetFile.CopyToAsync(stream);
            asset.FileName = sourceName;
            asset.Size = assetFile.Length;

            var nextOrder = await db.WorkAssets
                .Where(a => a.WorkId == id)
                .Select(a => (int?)a.SortOrder)
                .MaxAsync() ?? -1;
            asset.SortOrder = nextOrder + 1;

            db.WorkAssets.Add(asset);
            await db.SaveChangesAsync();

            return Results.Ok(new[] { BuildAssetDto(asset, work.Id) });
        }).RequireAuthorization();

        // ─── 删除单个 3D 资源 ───
        group.MapDelete("/{id}/assets/{assetId}", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id,
            string assetId) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            var asset = await db.WorkAssets.FirstOrDefaultAsync(a => a.Id == assetId && a.WorkId == id);
            if (asset == null) return Results.NotFound();

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var assetsRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:AssetsDir") ?? "storage/assets");

            var sourceDir = MediaPaths.AssetSourceDir(assetsRoot, id, asset.Id);
            if (Directory.Exists(sourceDir))
                Directory.Delete(sourceDir, recursive: true);

            var previewDir = MediaPaths.AssetPreviewDir(mediaRoot, id, asset.Id);
            if (Directory.Exists(previewDir))
                Directory.Delete(previewDir, recursive: true);

            db.WorkAssets.Remove(asset);
            await db.SaveChangesAsync();

            return Results.Ok(new { deleted = true });
        }).RequireAuthorization();

        // ─── 调整 3D 资源顺序 ───
        group.MapPut("/{id}/assets/order", async (
            HttpContext http,
            AppDbContext db,
            string id,
            List<AssetOrderItem> req) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            foreach (var item in req)
            {
                var asset = await db.WorkAssets.FirstOrDefaultAsync(a => a.Id == item.AssetId && a.WorkId == id);
                if (asset != null)
                    asset.SortOrder = item.SortOrder;
            }
            await db.SaveChangesAsync();
            return Results.Ok(new { updated = true });
        }).RequireAuthorization();

        // ─── 3D 资源源文件原始字节(供查看器) ───
        group.MapGet("/{id}/assets/{assetId}/file", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id,
            string assetId) =>
        {
            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id);
            if (work == null) return Results.NotFound();

            var asset = await db.WorkAssets.FirstOrDefaultAsync(a => a.Id == assetId && a.WorkId == id);
            if (asset == null) return Results.NotFound();

            var assetsRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:AssetsDir") ?? "storage/assets");
            var fullPath = Path.Combine(MediaPaths.AssetSourceDir(assetsRoot, id, asset.Id), asset.FileName);
            if (!File.Exists(fullPath)) return Results.NotFound();

            return Results.File(fullPath, "application/octet-stream", enableRangeProcessing: true);
        }).RequireAuthorization();

        // ─── 下载 3D 资源(原始文件名) ───
        group.MapGet("/{id}/assets/{assetId}/download", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id,
            string assetId) =>
        {
            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id);
            if (work == null) return Results.NotFound();

            var asset = await db.WorkAssets.FirstOrDefaultAsync(a => a.Id == assetId && a.WorkId == id);
            if (asset == null) return Results.NotFound();

            var assetsRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:AssetsDir") ?? "storage/assets");
            var fullPath = Path.Combine(MediaPaths.AssetSourceDir(assetsRoot, id, asset.Id), asset.FileName);
            if (!File.Exists(fullPath)) return Results.NotFound();

            return Results.File(fullPath, "application/octet-stream", asset.OriginalName, enableRangeProcessing: true);
        }).RequireAuthorization();

        // ─── 上传封面(视频作品手动封面) ───
        group.MapPost("/{id}/cover", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            var file = http.Request.Form.Files.FirstOrDefault();
            if (file == null)
                return Results.BadRequest(new { error = "未收到封面文件" });
            if (UploadRules.DetectType(file.FileName) != "image")
                return Results.BadRequest(new { error = "封面必须是图片" });
            if (file.Length > UploadRules.MaxImageSize)
                return Results.BadRequest(new { error = "封面超过 50MB 限制" });

            var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
            var dir = MediaPaths.WorkDir(mediaRoot, id);
            Directory.CreateDirectory(dir);

            // 删除旧封面文件(非媒体项)
            if (!string.IsNullOrEmpty(work.CoverFileName))
            {
                var oldPath = Path.Combine(dir, work.CoverFileName);
                if (File.Exists(oldPath) && !db.Medias.Any(m => m.WorkId == id && m.FileName == work.CoverFileName))
                    File.Delete(oldPath);
            }

            var storedName = $"cover_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            var fullPath = Path.Combine(dir, storedName);
            await using (var stream = File.Create(fullPath))
                await file.CopyToAsync(stream);

            work.CoverFileName = storedName;
            work.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { coverUrl = MediaPaths.WorkUrl(id, storedName) });
        }).RequireAuthorization();

        // ─── 指定既有图片为封面 ───
        group.MapPut("/{id}/cover/{mediaId}", async (
            HttpContext http,
            AppDbContext db,
            IConfiguration config,
            string id,
            string mediaId) =>
        {
            var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Results.Unauthorized();

            var work = await db.Works.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
            if (work == null) return Results.NotFound();

            var media = await db.Medias.FirstOrDefaultAsync(m => m.Id == mediaId && m.WorkId == id);
            if (media == null || media.Type != "image")
                return Results.BadRequest(new { error = "封面只能设为该作品的图片" });

            // 删除旧显式封面文件
            if (!string.IsNullOrEmpty(work.CoverFileName) && work.CoverFileName != media.FileName)
            {
                var mediaRoot = Path.Combine(Directory.GetCurrentDirectory(),
                    config.GetValue<string>("Storage:MediaDir") ?? "storage/media");
                var oldPath = Path.Combine(MediaPaths.WorkDir(mediaRoot, id), work.CoverFileName);
                if (File.Exists(oldPath) && !db.Medias.Any(m => m.WorkId == id && m.FileName == work.CoverFileName))
                    File.Delete(oldPath);
            }

            work.CoverFileName = media.FileName;
            work.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { coverUrl = MediaPaths.WorkUrl(id, media.FileName) });
        }).RequireAuthorization();
    }

    // ─── 构建 DTO ───

    public static string? EffectiveCoverUrl(Work work)
    {
        if (!string.IsNullOrEmpty(work.CoverFileName))
            return MediaPaths.WorkUrl(work.Id, work.CoverFileName);
        var firstImage = work.MediaItems
            .Where(m => m.Type == "image")
            .OrderBy(m => m.SortOrder)
            .FirstOrDefault();
        return firstImage != null ? MediaPaths.WorkUrl(work.Id, firstImage.FileName) : null;
    }

    public static WorkListItem BuildListItem(Work work)
    {
        var tags = work.WorkTags.Select(wt => wt.Tag!.Name).OrderBy(n => n).ToList();
        var hasVideo = work.MediaItems.Any(m => m.Type == "video");
        var type = NormalizeType(work.Type);
        var has3D = type == "3d";
        return new WorkListItem(
            work.Id,
            work.Title,
            type,
            work.Intro,
            EffectiveCoverUrl(work),
            hasVideo,
            has3D,
            tags,
            new AuthorInfo(work.UserId, work.User?.UserName ?? ""),
            work.MediaItems.Count,
            work.CreatedAt);
    }

    public static WorkDetail BuildDetail(Work work)
    {
        var mediaItems = work.MediaItems
            .OrderBy(m => m.SortOrder)
            .Select(m => new MediaDto(
                m.Id,
                MediaPaths.WorkUrl(work.Id, m.FileName),
                m.Type,
                m.SortOrder,
                m.Size))
            .ToList();
        var tags = work.WorkTags.Select(wt => wt.Tag!.Name).OrderBy(n => n).ToList();
        var characters = work.CharacterWorks
            .Where(cw => cw.Character != null)
            .Select(cw => new CharacterRef(
                cw.Character!.Id,
                cw.Character.Name,
                cw.Character.PreviewFileName != null
                    ? MediaPaths.CharacterUrl(cw.Character.Id, cw.Character.PreviewFileName)
                    : null))
            .ToList();
        var parts = work.WorkParts
            .Where(wp => wp.Part != null)
            .Select(wp => new PartRef(
                wp.Part!.Id,
                wp.Part.Name,
                wp.Part.Category,
                wp.Part.PreviewFileName != null
                    ? MediaPaths.PartUrl(wp.Part.Id, wp.Part.PreviewFileName)
                    : null))
            .ToList();

        var assets = work.Assets
            .OrderBy(a => a.SortOrder)
            .Select(a => BuildAssetDto(a, work.Id))
            .ToList();

        return new WorkDetail(
            work.Id,
            work.Title,
            NormalizeType(work.Type),
            work.Prompt,
            work.Intro,
            work.WorkflowJson,
            EffectiveCoverUrl(work),
            mediaItems,
            assets,
            tags,
            characters,
            parts,
            new AuthorInfo(work.UserId, work.User?.UserName ?? ""),
            work.CreatedAt,
            work.UpdatedAt);
    }

    public static WorkAssetDto BuildAssetDto(WorkAsset asset, string workId)
    {
        return new WorkAssetDto(
            asset.Id,
            asset.AssetType,
            MediaPaths.AssetFileUrl(workId, asset.Id),
            MediaPaths.AssetDownloadUrl(workId, asset.Id),
            asset.PreviewFileName != null
                ? MediaPaths.AssetPreviewUrl(workId, asset.Id, asset.PreviewFileName)
                : null,
            asset.OriginalName,
            asset.SortOrder,
            asset.Size);
    }

    /// <summary>归一化作品类型:2d / 3d(其余视为 2d)</summary>
    private static string NormalizeType(string? t) =>
        (t?.Trim().ToLowerInvariant() ?? "2d") switch { "3d" => "3d", _ => "2d" };
}

public record MediaOrderItem(string MediaId, int SortOrder);

public record AssetOrderItem(string AssetId, int SortOrder);
