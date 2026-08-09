using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

/// <summary>作品的媒体文件(图片/视频)</summary>
public class Media
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string WorkId { get; set; } = string.Empty;

    public Work? Work { get; set; }

    /// <summary>文件名(存于 works/{workId} 目录)</summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>类型:image / video</summary>
    [Required]
    [MaxLength(10)]
    public string Type { get; set; } = string.Empty;

    /// <summary>展示顺序</summary>
    public int SortOrder { get; set; }

    /// <summary>文件大小(字节)</summary>
    public long Size { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
