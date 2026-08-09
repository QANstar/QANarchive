using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.Models;

namespace QANgalleryServer.Services;

/// <summary>全局标签池管理:规范化、确保存在、替换关联、重算使用计数</summary>
public static class TagService
{
    /// <summary>规范化标签名列表(去空白、去空、大小写不敏感去重)</summary>
    public static List<string> Normalize(IEnumerable<string>? names)
    {
        if (names == null) return new();
        return names
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(50)
            .ToList();
    }

    /// <summary>确保标签存在,返回 Tag 实体(新标签自动创建并持久化)</summary>
    public static async Task<List<Tag>> EnsureTagsAsync(AppDbContext db, IEnumerable<string>? names)
    {
        var list = Normalize(names);
        if (list.Count == 0) return new();

        var result = new List<Tag>();
        foreach (var name in list)
        {
            var tag = await db.Tags.FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower());
            if (tag == null)
            {
                tag = new Tag { Name = name };
                db.Tags.Add(tag);
            }
            result.Add(tag);
        }
        await db.SaveChangesAsync(); // 确保新标签拿到 ID
        return result;
    }

    /// <summary>全量重算所有标签的使用计数(库规模小,保证正确性优先)</summary>
    public static async Task RecomputeUsageAsync(AppDbContext db)
    {
        var tags = await db.Tags.ToListAsync();

        var charCounts = await db.CharacterTags
            .GroupBy(ct => ct.TagId)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync();
        var workCounts = await db.WorkTags
            .GroupBy(wt => wt.TagId)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync();
        var partCounts = await db.PartTags
            .GroupBy(pt => pt.TagId)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync();

        var counts = charCounts.Concat(workCounts).Concat(partCounts)
            .GroupBy(x => x.Key)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Count));

        foreach (var t in tags)
            t.UsageCount = counts.TryGetValue(t.Id, out var c) ? c : 0;

        await db.SaveChangesAsync();
    }

    /// <summary>整体替换作品的标签关联(删除旧关联 → 建立新关联 → 重算计数)</summary>
    public static async Task ReplaceWorkTagsAsync(AppDbContext db, string workId, IEnumerable<string>? tagNames)
    {
        var existing = await db.WorkTags.Where(wt => wt.WorkId == workId).ToListAsync();
        db.WorkTags.RemoveRange(existing);
        await db.SaveChangesAsync();

        var tags = await EnsureTagsAsync(db, tagNames);
        foreach (var tag in tags)
            db.WorkTags.Add(new WorkTag { WorkId = workId, TagId = tag.Id });
        await db.SaveChangesAsync();
        await RecomputeUsageAsync(db);
    }

    /// <summary>整体替换角色的标签关联</summary>
    public static async Task ReplaceCharacterTagsAsync(AppDbContext db, string characterId, IEnumerable<string>? tagNames)
    {
        var existing = await db.CharacterTags.Where(ct => ct.CharacterId == characterId).ToListAsync();
        db.CharacterTags.RemoveRange(existing);
        await db.SaveChangesAsync();

        var tags = await EnsureTagsAsync(db, tagNames);
        foreach (var tag in tags)
            db.CharacterTags.Add(new CharacterTag { CharacterId = characterId, TagId = tag.Id });
        await db.SaveChangesAsync();
        await RecomputeUsageAsync(db);
    }

    /// <summary>整体替换部件的标签关联</summary>
    public static async Task ReplacePartTagsAsync(AppDbContext db, string partId, IEnumerable<string>? tagNames)
    {
        var existing = await db.PartTags.Where(pt => pt.PartId == partId).ToListAsync();
        db.PartTags.RemoveRange(existing);
        await db.SaveChangesAsync();

        var tags = await EnsureTagsAsync(db, tagNames);
        foreach (var tag in tags)
            db.PartTags.Add(new PartTag { PartId = partId, TagId = tag.Id });
        await db.SaveChangesAsync();
        await RecomputeUsageAsync(db);
    }
}
