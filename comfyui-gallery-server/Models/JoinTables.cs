using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

// ─── 多对多连接表 ───

/// <summary>作品 ↔ 角色(合集)</summary>
public class CharacterWork
{
    [Required]
    public string CharacterId { get; set; } = string.Empty;
    public Character? Character { get; set; }

    [Required]
    public string WorkId { get; set; } = string.Empty;
    public Work? Work { get; set; }
}

/// <summary>作品 ↔ 部件(可选关联)</summary>
public class WorkPart
{
    [Required]
    public string WorkId { get; set; } = string.Empty;
    public Work? Work { get; set; }

    [Required]
    public string PartId { get; set; } = string.Empty;
    public Part? Part { get; set; }
}

/// <summary>角色 ↔ 标签</summary>
public class CharacterTag
{
    [Required]
    public string CharacterId { get; set; } = string.Empty;
    public Character? Character { get; set; }

    [Required]
    public string TagId { get; set; } = string.Empty;
    public Tag? Tag { get; set; }
}

/// <summary>作品 ↔ 标签</summary>
public class WorkTag
{
    [Required]
    public string WorkId { get; set; } = string.Empty;
    public Work? Work { get; set; }

    [Required]
    public string TagId { get; set; } = string.Empty;
    public Tag? Tag { get; set; }
}

/// <summary>部件 ↔ 标签</summary>
public class PartTag
{
    [Required]
    public string PartId { get; set; } = string.Empty;
    public Part? Part { get; set; }

    [Required]
    public string TagId { get; set; } = string.Empty;
    public Tag? Tag { get; set; }
}
