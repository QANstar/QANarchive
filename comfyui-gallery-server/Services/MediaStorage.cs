namespace QANgalleryServer.Services;

/// <summary>媒体存储路径与 URL 构造</summary>
public static class MediaPaths
{
    public static string WorkDir(string mediaRoot, string workId) => Path.Combine(mediaRoot, "works", workId);
    public static string CharacterDir(string mediaRoot, string characterId) => Path.Combine(mediaRoot, "characters", characterId);
    public static string PartDir(string mediaRoot, string partId) => Path.Combine(mediaRoot, "parts", partId);

    public static string WorkUrl(string workId, string fileName) => $"/media/works/{workId}/{fileName}";
    public static string CharacterUrl(string characterId, string fileName) => $"/media/characters/{characterId}/{fileName}";
    public static string PartUrl(string partId, string fileName) => $"/media/parts/{partId}/{fileName}";
}

/// <summary>上传文件校验规则</summary>
public static class UploadRules
{
    public static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    public static readonly HashSet<string> VideoExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".mp4", ".webm" };

    public const long MaxImageSize = 50L * 1024 * 1024;   // 50MB
    public const long MaxVideoSize = 500L * 1024 * 1024;  // 500MB

    /// <summary>根据扩展名判断类型:image / video / unknown</summary>
    public static string DetectType(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        if (ImageExtensions.Contains(ext)) return "image";
        if (VideoExtensions.Contains(ext)) return "video";
        return "unknown";
    }
}
