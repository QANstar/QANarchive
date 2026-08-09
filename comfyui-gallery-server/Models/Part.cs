using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

/// <summary>提示词部件(发型/服装/配饰等可复用 prompt 片段)</summary>
public class Part
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string UserId { get; set; } = string.Empty;

    public User? User { get; set; }

    /// <summary>分类:发型/服装/配饰/表情/场景…</summary>
    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>提示词片段</summary>
    [Required]
    public string Prompt { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Intro { get; set; }

    /// <summary>预览图文件名(存于 parts 目录)</summary>
    [MaxLength(255)]
    public string? PreviewFileName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<PartTag> PartTags { get; set; } = new();
    public List<WorkPart> WorkParts { get; set; } = new();
}
