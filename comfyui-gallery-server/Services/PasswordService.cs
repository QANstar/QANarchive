using Microsoft.AspNetCore.Identity;

namespace QANgalleryServer.Services;

/// <summary>密码哈希/校验(复用 Identity PasswordHasher)</summary>
public class PasswordService
{
    private readonly PasswordHasher<object> _hasher = new();

    public string HashPassword(string password)
        => _hasher.HashPassword(new object(), password);

    public bool VerifyPassword(string password, string storedHash)
        => _hasher.VerifyHashedPassword(new object(), storedHash, password)
            != PasswordVerificationResult.Failed;
}
