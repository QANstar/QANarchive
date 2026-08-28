namespace QANgalleryServer.Services;

/// <summary>媒体存储路径与 URL 构造</summary>
public static class MediaPaths
{
    public static string WorkDir(string mediaRoot, string workId) => Path.Combine(mediaRoot, "works", workId);
    public static string CharacterDir(string mediaRoot, string characterId) => Path.Combine(mediaRoot, "characters", characterId);
    public static string PartDir(string mediaRoot, string partId) => Path.Combine(mediaRoot, "parts", partId);

    // ─── 3D 资源 ───
    // 源文件:私有 storage/assets 根(不经 /media 静态映射,仅授权端点访问)
    public static string AssetSourceDir(string assetsRoot, string workId, string assetId) =>
        Path.Combine(assetsRoot, "works", workId, assetId);
    // 预览图:公开 storage/media 根(经 /media 静态路由)
    public static string AssetPreviewDir(string mediaRoot, string workId, string assetId) =>
        Path.Combine(mediaRoot, "works", workId, "assets", assetId);

    public static string WorkUrl(string workId, string fileName) => $"/media/works/{workId}/{fileName}";
    public static string CharacterUrl(string characterId, string fileName) => $"/media/characters/{characterId}/{fileName}";
    public static string PartUrl(string partId, string fileName) => $"/media/parts/{partId}/{fileName}";

    // 3D 资源 URL
    // 说明:FileUrl/DownloadUrl 指向需登录的 API 端点,相对 axios baseURL(/api);预览图为公开 /media 路径
    public static string AssetFileUrl(string workId, string assetId) => $"/works/{workId}/assets/{assetId}/file";
    public static string AssetDownloadUrl(string workId, string assetId) => $"/works/{workId}/assets/{assetId}/download";
    public static string AssetPreviewUrl(string workId, string assetId, string fileName) => $"/media/works/{workId}/assets/{assetId}/{fileName}";
}

/// <summary>上传文件校验规则</summary>
public static class UploadRules
{
    public static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    public static readonly HashSet<string> VideoExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".mp4", ".webm" };
    public static readonly HashSet<string> AssetExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".fbx", ".blend", ".zip", ".unitypackage" };

    public const long MaxImageSize = 50L * 1024 * 1024;   // 50MB
    public const long MaxVideoSize = 500L * 1024 * 1024;  // 500MB

    public const long MaxFbxSize = 200L * 1024 * 1024;    // 200MB
    public const long MaxBlendSize = 900L * 1024 * 1024;  // 900MB
    public const long MaxZipSize = 900L * 1024 * 1024;    // 900MB
    public const long MaxUnitypackageSize = 900L * 1024 * 1024; // 900MB

    /// <summary>根据扩展名判断类型:image / video / unknown</summary>
    public static string DetectType(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        if (ImageExtensions.Contains(ext)) return "image";
        if (VideoExtensions.Contains(ext)) return "video";
        return "unknown";
    }

    /// <summary>根据扩展名判断 3D 资源类型:fbx / blend / zip / unitypackage / unknown</summary>
    public static string DetectAssetType(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        if (AssetExtensions.Contains(ext)) return ext.TrimStart('.').ToLowerInvariant();
        return "unknown";
    }

    /// <summary>3D 资源类型对应的单文件大小上限</summary>
    public static long MaxAssetSize(string assetType) => assetType switch
    {
        "fbx" => MaxFbxSize,
        "blend" => MaxBlendSize,
        "zip" => MaxZipSize,
        "unitypackage" => MaxUnitypackageSize,
        _ => long.MaxValue
    };
}
