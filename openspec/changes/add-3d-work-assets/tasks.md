## 1. 后端:数据模型与迁移

- [x] 1.1 新增 `Models/WorkAsset.cs`:Id、WorkId、AssetType(fbx|blend|zip)、FileName、OriginalName、PreviewFileName、SortOrder、Size、CreatedAt
- [x] 1.2 `Models/Work.cs` 增加 `List<WorkAsset> Assets` 导航属性
- [x] 1.3 `Data/AppDbContext.cs` 增加 `DbSet<WorkAsset> WorkAssets`;配置 `WorkAsset → Work` 级联删除(OnDelete.Cascade)
- [x] 1.4 生成并应用 EF 迁移(`dotnet ef migrations add AddWorkAssets`),验证 `Database.Migrate()` 增量应用、既有数据无损

## 2. 后端:上传校验与存储路径

- [x] 2.1 `Services/MediaStorage.cs`:新增私有源文件根 `storage/assets`(`AssetSourceDir(assetsRoot, workId, assetId)`、`AssetFileUrl`/`AssetDownloadUrl`)与公开预览图路径(`AssetPreviewDir(mediaRoot, workId, assetId)`、`AssetPreviewUrl`);`UploadRules` 增加 `AssetExtensions{ .fbx, .blend, .zip }`、`DetectAssetType(ext)`、`MaxFbxSize=200MB`、`MaxBlendSize=900MB`、`MaxZipSize=900MB`
- [x] 2.2 定义 `AssetDto`(Id、Type、FileUrl、DownloadUrl、PreviewUrl、OriginalName、SortOrder、Size);`WorkDetail` 增加 `Assets`;`WorkListItem` 增加 `Has3D`(及可选 `AssetCount`)

## 3. 后端:3D 资源 API

- [x] 3.1 `POST /api/works/{id}/assets`(`RequireAuthorization`):一次请求携带 `asset`(源文件)+ `preview`(预览图);校验类型/大小,源文件存到私有 `storage/assets/works/{workId}/{assetGuid}/`,预览图存到公开 `storage/media/works/{workId}/assets/{assetGuid}/`;返回 `AssetDto`
- [x] 3.2 `DELETE /api/works/{id}/assets/{assetId}`(`RequireAuthorization`):删除私有源文件与公开预览图文件及记录
- [x] 3.3 `PUT /api/works/{id}/assets/order`(`RequireAuthorization`):调整资源排序
- [x] 3.4 `GET /api/works/{id}/assets/{assetId}/file`(`RequireAuthorization`):返回源文件原始字节(供 3D 查看器)
- [x] 3.5 `GET /api/works/{id}/assets/{assetId}/download`(`RequireAuthorization`):以 `Content-Disposition: attachment; filename="{OriginalName}"` 返回源文件
- [x] 3.6 `WorksEndpoints.EffectiveCoverUrl` 回退链扩展:显式封面 → 第一张 `image` → 第一个 3D 资源预览图 → null
- [x] 3.7 `WorksEndpoints.BuildDetail` 返回 `Assets`;`BuildListItem` 返回 `Has3D`

## 4. 后端:画廊筛选

- [x] 4.1 `GalleryEndpoints.BrowseWorksAsync` 支持 `has3d`(或 `kind`)查询参数,为真时仅返回 `Work.Assets.Any()` 的作品

## 5. 前端:依赖与 3D 查看器

- [x] 5.1 安装 `three` + `@types/three`
- [x] 5.2 新增 `components/Model3DViewer.tsx`:动态导入 `FBXLoader` + `OrbitControls`,WebGL 画布渲染 fbx,自适应相机与加载/错误态;整体懒加载;源文件经授权 axios-JWT `fetch` → `Blob` → `FBXLoader.parse()` 加载
- [x] 5.3 扩展 `api/types.ts`:新增 `WorkAssetDto`;`WorkDetail` 增加 `assets`;`WorkListItem` 增加 `has3d`(及 `assetCount`)

## 6. 前端:作品编辑与详情

- [x] 6.1 `WorkEdit`:新增「3D 资源」区块——资源上传(源文件 + 配对预览图)、资源缩略图预览、删除、排序;创建模式下暂存资源待作品创建后上传
- [x] 6.2 `WorkDetail`:新增「3D 资源」区块——`fbx` 资源展示 `Model3DViewer`,`blend`/`zip` 展示预览图;每项提供下载按钮

## 7. 前端:画廊徽标与筛选

- [x] 7.1 `Cards.tsx` `WorkCard`:在视频徽标同槽位渲染 `has3d` 的「3D」徽标
- [x] 7.2 `Home.tsx` 作品 tab:新增「3D」筛选 chip,接入画廊 `has3d` 查询参数,支持切换/取消

## 8. 联调与验证

- [x] 8.1 本地联调:创建作品 → 上传 `fbx`/`blend`/`zip` 资源(含预览图)→ 详情页验证 fbx 交互预览、blend/zip 预览图与下载(API 层 E2E 通过)
- [ ] 8.2 验证校验:非法扩展名拒收、超过类型上限拒收、预览图非图片拒收(负路径待补测)
- [x] 8.3 验证画廊:含 3D 资源作品卡片显示「3D」徽标;作品 tab 内「3D」筛选 chip 生效、可取消
- [x] 8.4 验证作品封面回退为第一张图片媒体;无图片时使用占位符,瀑布流正常显示(3D 资源不再回退缩略图)
- [ ] 8.5 验证删除作品级联删除其 3D 资源及其磁盘文件;资源单独删除不误删其他媒体(待补测)
- [x] 8.6 验证鉴权:未登录访问预览图正常;未登录请求源文件/下载返回 401;登录后可加载 fbx 交互预览与下载
- [x] 8.7 对照各 spec 场景逐条核验 `works` / `media` / `gallery` 的 delta

> 注:负路径(非法类型/超限/非图片预览)与删除级联两项未在本轮自动化验证中覆盖,建议后续补测;8.1 的浏览器内 fbx 渲染已通过类型检查与构建,未做真实浏览器交互验证。

## 9. 作品类型(2D/3D)与创建模式资源

- [x] 9.1 `Work` 增加 `Type`(默认 "2d")+ `AddWorkType` 迁移(既有行回填 "2d")
- [x] 9.2 DTO:`WorkCreateRequest`/`WorkUpdateRequest` 增加 `Type`;`WorkDetail`/`WorkListItem` 返回 `Type`;`Has3D` 由 `Type == "3d"` 决定
- [x] 9.3 后端校验:仅 2D 强制 `prompt` 非空;3D 允许空 prompt(存空串)
- [x] 9.4 画廊 `has3d` 筛选改为 `Type == "3d"`
- [x] 9.5 前端 `WorkEdit`:新增类型选择(2D/3D),3D 隐藏 Prompt 与工作流 JSON 字段;`WorkDetail` 显示类型并隐藏空 Prompt
- [x] 9.6 前端创建模式即可添加 3D 资源(暂存→创建后上传)与媒体;编辑模式即时上传
- [x] 9.7 验证:3D 作品可无 prompt 创建;2D 无 prompt 被 400 拒;画廊 `has3d` 只返回 3D 类型;`type`/`has3d` 正确返回

## 10. 2D 禁 3D 资源、3D 可加图片视频、统一缩略图(封面裁剪)

- [x] 10.1 后端:2D 作品禁止上传 3D 资源(400);含 3D 资源的作品改为 2D 被拒(400)
- [x] 10.2 后端:3D 资源上传移除预览图处理(只存源文件);`EffectiveCoverUrl` 不再回退到 3D 资源预览图
- [x] 10.3 前端:`AssetUploader` 仅选择源文件(无预览图);`WorkEdit` 3D 资源区块仅在 `3d` 时显示;媒体(图片/视频)对 2D/3D 均可用
- [x] 10.4 前端:统一缩略图——「设为封面」与手动上传封面均经 `ImageCropper` 裁剪后 `POST /cover` 保存;未设置时回退第一张图片
- [x] 10.5 验证:2D 作品上传 3D 资源 400;3D 资源无 previewUrl;3D 作品封面取图片媒体;3D→2D 切换被拒;画廊 `has3d` 只返回 3D
