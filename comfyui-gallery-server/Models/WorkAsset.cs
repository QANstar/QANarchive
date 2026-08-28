using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

/// <summary>作品的 3D 资源(源文件 fbx/blend/zip/unitypackage + 配对预览图)</summary>
public class WorkAsset
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string WorkId { get; set; } = string.Empty;

    public Work? Work { get; set; }

    /// <summary>资源类型:fbx / blend / zip / unitypackage</summary>
    [Required]
    [MaxLength(20)]
    public string AssetType { get; set; } = string.Empty;

    /// <summary>源文件存储名(位于私有 storage/assets 根)</summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>原始文件名(用于下载)</summary>
    [Required]
    [MaxLength(255)]
    public string OriginalName { get; set; } = string.Empty;

    /// <summary>预览图存储名(位于公开 storage/media 根)</summary>
    [MaxLength(255)]
    public string? PreviewFileName { get; set; }

    /// <summary>展示顺序</summary>
    public int SortOrder { get; set; }

    /// <summary>源文件大小(字节)</summary>
    public long Size { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
