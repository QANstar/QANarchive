using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

/// <summary>角色(合集):作品的多对多分组包装</summary>
public class Character
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>创建者 ID</summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    public User? User { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>角色设定 prompt</summary>
    [Required]
    public string Prompt { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Intro { get; set; }

    /// <summary>预览图文件名(存于 characters 目录)</summary>
    [MaxLength(255)]
    public string? PreviewFileName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<CharacterTag> CharacterTags { get; set; } = new();
    public List<CharacterWork> CharacterWorks { get; set; } = new();
}
