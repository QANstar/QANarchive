using System.ComponentModel.DataAnnotations;

namespace QANgalleryServer.Models;

/// <summary>用户</summary>
public class User
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>登录账号(唯一)</summary>
    [Required]
    [MaxLength(50)]
    public string Account { get; set; } = string.Empty;

    /// <summary>显示名</summary>
    [Required]
    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    /// <summary>密码哈希(Identity PasswordHasher)</summary>
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
