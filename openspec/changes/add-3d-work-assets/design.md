## Context

现有收藏站以「作品(Work)」为核心实体,归档 ComfyUI 生成物:图片/视频媒体、prompt、可选工作流 JSON、标签,并多对多关联角色(合集)与提示词部件。用户同时制作 3D 模型(FBX 模型、Blender 源文件、含完整资源的 zip 包),需在作品层面一并归档并支持交互预览。

沿用现有技术栈:ASP.NET Core 9 Minimal API + EF Core SQLite + JWT Bearer;前端 React (Vite) + TS + Nginx。媒体走 `/media` 静态路由,磁盘存储 `storage/media/{works|characters|parts}/{entityId}/…`。

## Goals / Non-Goals

**Goals:**

- 作品可关联 0..N 个 3D 资源,每个资源 = 源文件(fbx/blend/zip)+ 配对预览图,支持排序、单个删除、以原始文件名下载。
- `fbx` 资源在详情页提供浏览器内 3D 交互预览;`blend`/`zip` 仅预览图 + 下载。
- 画廊中:含 3D 资源的作品卡片展示「3D」徽标;作品 tab 内提供「3D」筛选 chip。
- 纯 3D 作品(无图片/视频媒体)在瀑布流正常显示(封面回退到第一个资源预览图)。
- 3D 资源与图片/视频媒体彻底分开,互不干扰既有媒体管理逻辑。

**Non-Goals:**

- 不渲染 `.blend`(浏览器无法解析 Blender 二进制格式,仅预览图)。
- 不解压/解析 zip 内容(仅作为完整资源包存储与下载)。
- 不做服务端 FBX→glTF 转换(避免容器引入 Blender/assimp 体积与耗时);采用前端 best-effort 渲染。
- 不为 3D 资源自动抽帧/生成预览图(预览图由用户上传)。
- 不改动角色/部件模块与既有图片/视频媒体逻辑。

## Decisions

### D1: 新增独立 `WorkAsset` 实体(而非扩展 `Media.type`)

```
Work (1) ──< Media(图片/视频,既有)     ── 展示媒体
        └──< WorkAsset(3D 源文件,新增) ── 源资源
```

- 理由:`Media` 承担「画廊展示媒体 + 封面」语义,与「可下载的源文件资源」语义不同;混在一处会让封面、排序、下载、类型白名单相互纠缠。独立实体更清晰、可演进。
- `WorkAsset` 字段:`Id`、`WorkId`(FK,级联删除)、`AssetType`(`fbx`|`blend`|`zip`)、`FileName`(存储名)、`OriginalName`(原始文件名,用于下载)、`PreviewFileName`、`SortOrder`、`Size`、`CreatedAt`。
- `Work.Assets` 导航属性;EF 配置 `OnDelete(Cascade)`。

### D2: 存储布局与 URL(源文件私有、预览图公开)

```
// 3D 源文件 —— 私有,不经 /media 静态映射
storage/assets/works/{workId}/{assetGuid}/{guid}.fbx   (或 .blend / .zip)

// 3D 预览图 —— 公开,经 /media 静态路由
storage/media/works/{workId}/assets/{assetGuid}/preview_{guid}.png
```

- 源文件与预览图记录一一对应(同 `assetGuid`),删除时一并清理。
- **源文件存放于独立 `storage/assets/` 根,不加入 `/media` 静态映射**,因此未登录无法通过 URL 直接访问;仅通过授权端点返回(`/file` 原始字节、`/download` 附件+原始文件名)。
- **预览图存放于 `storage/media/.../assets/`**,经 `/media` 公开,供画廊卡片、列表与详情页渲染。
- 备选:把源文件也放 `/media` 下再以中间件拦截——鉴权路径判断复杂;采用独立根目录,安全边界清晰。

### D3: 上传规则与大小上限

- `UploadRules` 扩展:`AssetExtensions = { .fbx, .blend, .zip }`,`DetectAssetType(ext)` 返回 `fbx`/`blend`/`zip`。
- 大小上限:`fbx ≤ 200MB`,`blend ≤ 900MB`,`zip ≤ 900MB`;multipart 总请求体与 Kestrel `MaxRequestBodySize` 维持 1GB。
- 预览图沿用图片规则(jpg/png/webp/gif ≤ 50MB)。
- 一次上传请求 `POST /api/works/{id}/assets` 同时携带 `asset`(源文件)+ `preview`(预览图),配对保存。
- 扩展:如需 >1GB 的单个资源,当前不做分片上传,记录为 Open Question。

### D4: FBX 浏览器内预览(best-effort)

- 前端新增 `three` + `@types/three`;用 `FBXLoader`(`three/examples/jsm/loaders/FBXLoader.js`)+ `OrbitControls` 在详情页渲染。
- 查看器**懒加载**(动态 `import`),避免撑大首屏包体。
- 因源文件需登录,查看器通过**授权客户端**(携带 JWT)以 `fetch` → `Blob` → `FBXLoader.parse()` 的方式加载,而非直接用静态 URL/`<src>`。
- 保真度约束:仅当 FBX **内嵌**贴图时可带贴图渲染;若 FBX 引用外部贴图(相对路径),因存储平铺按 GUID 命名、未保留原目录结构,渲染为无贴图网格。
- 备选(否决):`<model-viewer>`(仅 glTF/GLB,不支持 FBX);服务端 glTF 转换(容器体积/耗时高);s3 端 zip 解压提取(复杂且不能保证贴图齐全)。
- 结论:接受 best-effort;完整带贴图交付建议走 `.zip` 完整资源包。

### D5: DTO 与 API

- `WorkAssetDto(Id, Type, FileUrl, DownloadUrl, PreviewUrl, OriginalName, SortOrder, Size)`。其中 `FileUrl` 指向需登录的文件端点,`DownloadUrl` 指向下载端点,`PreviewUrl` 为公开的 `/media` 预览图。
- `WorkDetail` 新增 `Assets: List<WorkAssetDto>`。
- `WorkListItem` 新增 `Has3D: bool`(以及可选 `AssetCount`)。
- 端点(源文件/下载均需登录,预览图公开):
  - `POST /api/works/{id}/assets` —— `RequireAuthorization`,上传(源文件 + 预览图)
  - `DELETE /api/works/{id}/assets/{assetId}` —— `RequireAuthorization`,删除(源文件 + 预览图)
  - `PUT /api/works/{id}/assets/order` —— `RequireAuthorization`,排序
  - `GET /api/works/{id}/assets/{assetId}/file` —— `RequireAuthorization`,返回源文件原始字节(供 3D 查看器)
  - `GET /api/works/{id}/assets/{assetId}/download` —— `RequireAuthorization`,以原始文件名作为附件下载
  - 预览图 —— 公开 `/media` 静态路由,无鉴权
- `WorksEndpoints.EffectiveCoverUrl` 回退链:显式封面 → 第一张 `image` → 第一个 3D 资源预览图 → `null`。

### D6: 画廊筛选与徽标

- `WorkCard` 在 `hasVideo` 徽标同槽位渲染 `has3d` 的「3D」徽标。
- `GalleryEndpoints.BrowseWorksAsync` 新增 `kind`(或 `has3d`)查询参数;为 `true` 时仅返回 `Work.Assets.Any()` 的作品。
- 作品 tab 内新增「3D」筛选 chip,与既有热门标签 chips 并列。

### D7: 迁移与数据库

- 新增 `WorkAssets` 表 + `Work.Assets` 导航;经 EF `Database.Migrate()` 增量迁移(一次 `_Migrate` 重放),不破坏既有 `Works`/`Medias` 数据。
- 删除作品时级联删除其全部 `WorkAsset` 及其磁盘目录。

### D8: 作品类型与 3D 资源创建

- `Work` 新增 `Type` 字段(`"2d"` / `"3d"`,默认 `"2d"`;`AddWorkType` 迁移把既有行回填 `"2d"`),在创建/编辑时由用户选择。
- 3D 作品:前端隐藏「Prompt」与「ComfyUI 工作流 JSON」字段,`Prompt` 允许为空(后端仅对 2D 强制 `prompt` 非空);无需再造工作流。
- `WorkListItem` / `WorkDetail` 返回 `Type`;`Has3D` 由 `Type == "3d"` 决定,画廊 `has3d` 筛选也改为 `Type == "3d"`。
- 3D 资源上传在**创建与编辑模式**都可用:创建模式先暂存(资源文件 + 预览图),作品创建后统一上传;编辑模式即时上传。媒体(图片/视频)同理。


## Risks / Trade-offs

- [FBX 外部贴图渲染不完整] → 接受 best-effort;完整带贴图走 `.zip` 完整资源包;记录为已知限制。
- [blend/zip 可能接近 1GB 请求上限] → 限定 blend/zip ≤ 900MB;>1GB 需分片(本期不做)。
- [three.js 增加前端包体与首屏开销] → FBX 查看器懒加载;仅详情页命中 fbx 资源时才动态导入。
- [3D 源文件与下载需登录] → 通过独立 `storage/assets` 根(不经 `/media`)+ `RequireAuthorization` 端点实现;预览图保持公开以保证画廊显示。
- [assets 与 media 并存导致删除/封面逻辑分支增多] → 用独立实体 + 独立端点收敛,封面回退链明确化。

## Migration Plan

- 新增 `WorkAssets` 迁移(`dotnet ef migrations add AddWorkAssets` 生成;运行期 `Database.Migrate()` 自动应用)。
- 回滚:删除迁移并还原 `Work`/`AppDbContext`/`Program.cs` 改动;或从 `git` 回退该变更涉及文件后重建容器。

## Open Questions

- 是否允许资源超过 1GB(需要分片/流式上传)?本期按类型上限 900MB 处理,后续需要再扩展。
- 是否需要为 `.blend` 也提供"生成预览图"的辅助(如 Blender 命令行出图)?本期由用户上传预览图。
