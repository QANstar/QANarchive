using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

/// <summary>全局标签池(作品/角色/部件共用)</summary>
public class Tag
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>标签名(大小写不敏感唯一)</summary>
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    /// <summary>使用计数(关联的作品+角色+部件总数)</summary>
    public int UsageCount { get; set; }

    public List<CharacterTag> CharacterTags { get; set; } = new();
    public List<WorkTag> WorkTags { get; set; } = new();
    public List<PartTag> PartTags { get; set; } = new();
}
