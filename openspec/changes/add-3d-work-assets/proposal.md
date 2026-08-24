## Why

现有收藏站只归档 ComfyUI 生成的**图片/视频**与 prompt/工作流。用户也制作 **3D 模型**(FBX、Blender 源文件、打包好的完整资源),目前散落在本地、无法在画廊里按作品归档与检索。需要在作品上增加「3D 资源」这一载体,把源文件、预览图与作品一体管理,并在画廊中让 3D 作品可识别、可筛选、可交互预览。

## What Changes

- 作品(Work)新增**类型(2D / 3D)**:创建/编辑时选择,默认 2D;3D 作品不要求 prompt 与 ComfyUI 工作流 JSON,画廊按类型显示「3D」徽标与筛选。
- 作品(Work)新增**独立的 3D 资源集合 `assets`**,与现有图片/视频 `mediaItems` 平行、互不干扰;创建与编辑模式均可添加。
- 每个 3D 资源 = 一个**源文件**(`fbx`/`blend`/`zip`);支持排序、单个删除、下载;3D 资源**不再单独上传预览图**。
- `fbx` 资源在作品详情页提供**浏览器内 3D 交互预览**(three.js `FBXLoader`);`blend`/`zip` 因浏览器无法渲染,仅提供下载。
- 3D 作品可同时**添加图片/视频媒体**(2D 资源)作为内容与封面来源。
- **2D 作品不能添加 3D 资源**(后端拦截,400);含 3D 资源的作品不能改为 2D。
- **统一缩略图(封面)**:2D/3D 共用一套,选图后经 `ImageCropper` 裁剪;未显式设置时回退到第一张图片,无图片时用占位符。
- **3D 资源源文件(fbx/blend/zip)与下载需登录**(经授权 API 端点,携带 JWT);作品缩略图(图片媒体/裁剪产物)公开,经 `/media`。源文件存于独立 `storage/assets` 根、不经 `/media` 静态映射。
- 画廊中,含 3D 资源的作品卡片展示「3D」徽标;作品 tab 内提供「3D」筛选 chip。
- 前端新增 `three` + `@types/three` 依赖,FBX 查看器**懒加载**,不撑大首屏包体。

## Capabilities

### New Capabilities

<!-- 无:3D 资源作为作品能力与媒体/画廊能力的扩展实现,不新增独立 capability -->

### Modified Capabilities

- `works`:作品新增 2D/3D 类型、3D 资源关联(增删/排序,仅 3D 作品)、统一缩略图(封面裁剪),封面回退到第一张图片。
- `media`:新增 3D 源文件(fbx/blend/zip)上传规则、大小/类型校验、源文件/下载需登录;作品缩略图与图片媒体公开访问。
- `gallery`:作品卡片「3D」徽标 + 作品 tab 内「3D」筛选。

## Impact

- 后端:`QANgalleryServer` 新增 `WorkAsset` 模型与 `Work.Assets` 导航属性、`Work.Type` + EF 迁移、`/api/works/{id}/assets` 系列接口(源文件/下载 `RequireAuthorization`、`/file` 原始字节、`/download` 以原始文件名返回)、`/cover` 裁剪缩略图、存储(源文件私有 `storage/assets/…`、缩略图/图片媒体公开 `storage/media/…`)、`UploadRules` 扩展 3D 类型与大小上限、`WorkDetail`/`WorkListItem` DTO 扩展。
- 前端:`comfyui-gallery-web` 新增 `three` 依赖;新建 `Model3DViewer` 组件(FBX 交互预览)与 `AssetUploader`;`WorkEdit` / `WorkDetail` 增加「3D 资源」区块(仅 3D)、统一缩略图裁剪;`WorkCard` 增加「3D」徽标;画廊作品 tab 增加「3D」筛选 chip。
- 数据库:SQLite 新增 `WorkAssets` 表(级联删除)与 `Works.Type` 列,经 EF `Database.Migrate()` 增量迁移,不破坏既有数据。
- 无破坏性变更(在既有模型上新增字段与表)。
