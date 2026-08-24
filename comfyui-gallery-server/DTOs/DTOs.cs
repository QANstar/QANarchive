namespace QANgalleryServer.DTOs;

// ─── 认证 ───

public record RegisterRequest(string Account, string UserName, string Password, string InviteCode);

public record LoginRequest(string Account, string Password);

public record UserInfo(string Id, string Account, string UserName);

public record AuthResponse(string Token, UserInfo User);

// ─── 作品 ───

public record WorkCreateRequest(
    string Title,
    string Prompt,
    string? Intro,
    string? WorkflowJson,
    List<string>? Tags,
    List<string>? CharacterIds,
    List<string>? PartIds);

public record WorkUpdateRequest(
    string Title,
    string Prompt,
    string? Intro,
    string? WorkflowJson,
    List<string>? Tags,
    List<string>? CharacterIds,
    List<string>? PartIds);

public record AuthorInfo(string Id, string Name);

public record MediaDto(string Id, string Url, string Type, int SortOrder, long Size);

public record WorkAssetDto(
    string Id,
    string Type,
    string FileUrl,
    string DownloadUrl,
    string? PreviewUrl,
    string OriginalName,
    int SortOrder,
    long Size);

public record WorkListItem(
    string Id,
    string Title,
    string? Intro,
    string? CoverUrl,
    bool HasVideo,
    bool Has3D,
    List<string> Tags,
    AuthorInfo Author,
    int MediaCount,
    DateTime CreatedAt);

public record CharacterRef(string Id, string Name, string? PreviewUrl);

public record PartRef(string Id, string Name, string Category, string? PreviewUrl);

public record WorkDetail(
    string Id,
    string Title,
    string Prompt,
    string? Intro,
    string? WorkflowJson,
    string? CoverUrl,
    List<MediaDto> MediaItems,
    List<WorkAssetDto> Assets,
    List<string> Tags,
    List<CharacterRef> Characters,
    List<PartRef> Parts,
    AuthorInfo Author,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// ─── 角色 ───

public record CharacterCreateRequest(string Name, string Prompt, string? Intro, List<string>? Tags);

public record CharacterUpdateRequest(string Name, string Prompt, string? Intro, List<string>? Tags);

public record CharacterListItem(
    string Id,
    string Name,
    string? Intro,
    string? PreviewUrl,
    List<string> Tags,
    int WorkCount,
    DateTime CreatedAt);

public record CharacterDetail(
    string Id,
    string Name,
    string Prompt,
    string? Intro,
    string? PreviewUrl,
    List<string> Tags,
    List<WorkListItem> Works,
    AuthorInfo Author,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// ─── 部件 ───

public record PartCreateRequest(string Category, string Name, string Prompt, string? Intro, List<string>? Tags);

public record PartUpdateRequest(string Category, string Name, string Prompt, string? Intro, List<string>? Tags);

public record PartListItem(
    string Id,
    string Name,
    string Category,
    string? Intro,
    string? PreviewUrl,
    List<string> Tags,
    int UsedByCount,
    DateTime CreatedAt);

public record PartDetail(
    string Id,
    string Name,
    string Category,
    string Prompt,
    string? Intro,
    string? PreviewUrl,
    List<string> Tags,
    int UsedByCount,
    AuthorInfo Author,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// ─── 标签 ───

public record HotTagDto(string Id, string Name, int UsageCount);

// ─── 画廊分页 ───

public record PagedResponse<T>(List<T> Items, int Total, int Page, int PageSize, bool HasMore);
