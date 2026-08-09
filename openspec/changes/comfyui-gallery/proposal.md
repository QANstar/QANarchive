## Why

用 ComfyUI 生成的图片/视频、prompt 和工作流 JSON 散落在本地,无法检索、无法按角色或部件复用提示词,收藏后难以再次找到"当时是怎么做出来的"。需要一个自托管的收藏站,把生成物、角色设定、可复用的提示词部件统一归档,并能在局域网内共享浏览。

## What Changes

- 新增一个前后端分离的 Web 应用:React (Vite) 前端 + ASP.NET Core 9 Minimal API 后端,通过 Docker Compose 部署,数据持久化到 `./storage` 卷。
- 新增核心实体 **作品 (Work)**:包含标题、prompt、可选的 ComfyUI 工作流 JSON、简介、标签,以及多张图片/视频媒体;支持增删改查与媒体管理。
- 新增 **角色 (Character)** 合集:角色设定 prompt、预览图、简介、标签;作品与角色为**多对多**关联,一个作品可出现在 0..N 个角色中(0 个 = 直接传图),角色页以合集形式展示关联作品。
- 新增 **部件 (Part)** 库:整理发型、服装、配饰等可复用提示词部件,带分类、prompt、预览图、简介、标签;作品可**可选关联**用到的部件。
- 新增 **标签 (Tag)** 全局标签池:跨作品/角色/部件共用,记录使用次数,首页展示热门标签用于筛选。
- 新增 **首页画廊**:搜索 + 瀑布流预览,支持「作品 / 角色 / 部件」tab 切换与热门 tag 筛选;纯局域网自用,内容全局共享可见。
- 新增 **用户系统**:注册需邀请码,登录签发 JWT;浏览公开、写入需认证。
- 配置采用 `appsettings.Example.json` 模板 + `appsettings.json` 与 `storage/` 进 `.gitignore` 的方式,沿用 QANassistantServer 的成熟模式。

## Capabilities

### New Capabilities

- `auth`: 用户注册(需邀请码)、登录、JWT 签发与身份校验
- `works`: 作品实体的增删改查,含 prompt、工作流 JSON、简介、标签,以及到角色/部件的多对多关联
- `characters`: 角色(合集)实体的增删改查,含角色设定 prompt、预览图、简介、标签
- `parts`: 提示词部件库的增删改查,含分类、prompt、预览图、简介、标签
- `media`: 媒体文件上传与静态托管(作品的图片/视频、视频手动封面、角色/部件预览图)
- `tags`: 全局标签池的创建、使用计数与热门标签
- `gallery`: 首页瀑布流、tab 切换、关键词搜索与 tag 筛选

### Modified Capabilities

<!-- 无:本项目为全新应用,不修改既有 spec -->

## Impact

- 新仓库:前端 `comfyui-gallery-web`(React/Vite/Nginx)、后端 `comfyui-gallery-server`(ASP.NET Core 9)。
- 技术栈沿用 QANassistantServer:SQLite + EF Core、JWT (HMAC-SHA256)、ASP.NET Core Identity `PasswordHasher`、Docker + docker-compose。
- 新增模型:User / Character / Work / Media / Part / Tag 及多对多连接表(CharacterWork、WorkPart、各实体标签连接表)。
- 新增 API 组:`/api/auth`、`/api/works`、`/api/characters`、`/api/parts`、`/api/media`、`/api/tags`、`/api/gallery`。
- 部署:docker-compose 双服务(前端 Nginx + 后端 API),`./storage` 卷持久化数据库与媒体文件。
- 无破坏性变更(全新应用)。
