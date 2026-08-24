using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

/// <summary>作品:收藏站核心实体</summary>
public class Work
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string UserId { get; set; } = string.Empty;

    public User? User { get; set; }

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    /// <summary>作品类型:2d / 3d</summary>
    [Required]
    [MaxLength(5)]
    public string Type { get; set; } = "2d";

    /// <summary>生成 prompt(3d 作品可不填)</summary>
    [Required]
    public string Prompt { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Intro { get; set; }

    /// <summary>ComfyUI 工作流 JSON(可选,≤1MB)</summary>
    public string? WorkflowJson { get; set; }

    /// <summary>封面文件名(显式封面;为空时默认取第一张图片)</summary>
    [MaxLength(255)]
    public string? CoverFileName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Media> MediaItems { get; set; } = new();
    public List<WorkAsset> Assets { get; set; } = new();
    public List<WorkTag> WorkTags { get; set; } = new();
    public List<CharacterWork> CharacterWorks { get; set; } = new();
    public List<WorkPart> WorkParts { get; set; } = new();
}
