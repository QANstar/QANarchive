## Context

全新的自托管「ComfyUI 作品收藏站」,用于归档 ComfyUI 生成的图片/视频、prompt 与工作流 JSON,并支持按角色(合集)与提示词部件(发型/服装/配饰等)进行组织。纯局域网自用,库内容全局共享可见。

后端沿用同工作区 `QANassistantServer` 的成熟技术栈:.NET 9 Minimal API + EF Core SQLite + JWT Bearer + ASP.NET Core Identity `PasswordHasher` + Docker Compose 卷持久化。前端为全新 React (Vite) 应用,由 Nginx 托管并反代 API。

## Goals / Non-Goals

**Goals:**

- 作品(Work)作为核心实体,支持多图/多视频、prompt、可选工作流 JSON、简介与标签的完整 CRUD。
- 作品↔角色、作品↔部件均为多对多关联;直接传图即"不关联任何角色"的作品。
- 全局共享可见的首页画廊:搜索 + 瀑布流 + 作品/角色/部件 tab 切换 + 热门 tag 筛选。
- 邀请码注册 + JWT 认证;浏览公开、写入需认证。
- Docker Compose 一键部署,`./storage` 卷持久化数据库与媒体文件;`appsettings.json` 与 `storage/` 进 `.gitignore`,提供 `appsettings.Example.json` 模板。
- 白/蓝/粉糖果色主题,Civitai 式瀑布流 UI。

**Non-Goals:**

- 不实现用户间点赞/收藏/评论等社区互动(纯归档分享站)。
- 不为视频自动抽帧(视频封面手动上传)。
- 不做公网部署/HTTPS/域名(纯局域网自用)。
- 不做内容审核、多租户权限细分(登录即可读写共享库)。
- 不做 ComfyUI 服务端集成(仅归档 workflow JSON 文本,供下载/复制回填)。

## Decisions

### D1: 双容器部署(Nginx 托管前端 + ASP.NET 后端)

```
┌─────────────── docker-compose ───────────────┐
│                                              │
│  ┌──────────────────┐    ┌────────────────┐  │
│  │  gallery-web     │    │  gallery-api   │  │
│  │  Nginx :80       │───▶│  Kestrel :5000 │  │
│  │  /api·/media 反代 │◀───│  /api/* /media/*│  │
│  └──────────────────┘    └───────┬────────┘  │
│                                  │           │
│                        ┌─────────▼────────┐  │
│                        │ ./storage 卷      │  │
│                        │  data/app.db     │  │
│                        │  media/...       │  │
│                        └──────────────────┘  │
└──────────────────────────────────────────────┘
```

- **备选 A**:单容器由后端同时托管 SPA 与 API。否决:前后端分离要求独立构建/独立演进,且 Nginx 托管静态资源性能更好。
- **备选 B**:前端本地 dev server + 后端分开跑。仅用于开发;部署统一走 Compose。

### D2: 数据模型(SQLite + EF Core)

```
User(1) ──< UserOwned: Character / Work / Part(记录作者,不参与浏览过滤)
Character ──< CharacterWork >── Work ──< WorkPart >── Part
Work ──< Media(图片/视频/封面)
Character/Work/Part ──< 各自的 Tag 连接表 >── Tag(全局池)
```

- 所有 ID 用 `Guid.ToString()`,沿用 QANassistantServer 风格。
- **多对多**用显式连接表实体(CharacterWork、WorkPart、CharacterTag、WorkTag、PartTag),便于以后扩展字段(如排序、关联时间)。
- **Media 表**:`WorkId / FileName / Type(image|video) / SortOrder`;`Work.CoverFileName` 单独存封面(默认取第一张图,纯视频作品由用户手动上传封面)。
- **WorkflowJson**:存 DB TEXT 列,上限 1MB(ComfyUI 工作流通常几十~几百 KB);超出拒绝保存并提示。
- 索引:Tag.Name 唯一 + UsageCount 排序索引;Work 的 CreatedAt 倒序;各连接表联合主键。

### D3: 认证复用 QANassistantServer 模式

- 注册 `POST /api/auth/register` 校验 `InviteCode`(来自配置);登录 `POST /api/auth/login` 返回 JWT。
- JWT HMAC-SHA256,`Jwt:Key/Issuer/Audience` 来自配置;`PasswordHasher` 存 PBKDF2 哈希。
- 浏览类接口(画廊/详情)公开;增删改接口 `RequireAuthorization()`。

### D4: 媒体存储与静态托管

- 磁盘目录:`storage/media/{works|characters|parts}/{entityId}/…`,文件名 `Guid + 原扩展名`。
- 后端 `UseStaticFiles` 映射 `/media` 路由(沿用 QANassistantServer 的 avatars/workshop 模式)。
- 上传限制:单文件图片 ≤ 50MB、视频 ≤ 500MB、multipart 总请求体 ≤ 1GB;允许扩展名白名单(jpg/png/webp/gif/mp4/webm)。
- 视频封面:由用户上传一张 image 类型文件,存入 `Work.CoverFileName`。

### D5: API 设计(REST,按模块分组)

| 组 | 端点 | 说明 |
|----|------|------|
| `/api/auth` | register / login | 公开 |
| `/api/works` | CRUD + media 增删 + 封面 + 角色/部件关联 | 需认证 |
| `/api/characters` | CRUD + 预览图 | 需认证 |
| `/api/parts` | CRUD + 预览图 | 需认证 |
| `/api/tags` | 热门标签列表 | 公开 |
| `/api/gallery` | 作品/角色/部件浏览(分页+搜索+tag 筛选) | 公开 |

- 画廊查询参数:`tab`(works/characters/parts)、`search`(标题/描述/prompt LIKE)、`tags`(逗号分隔,AND 逻辑)、`page/pageSize`。
- 列表项返回摘要(封面 URL、标签、作者),详情返回完整字段(含 workflowJson、媒体列表、关联)。

### D6: 前端 React 架构

- Vite + React + TypeScript;路由:首页画廊 `/`、作品详情 `/work/:id`、角色页 `/character/:id`(合集)、部件页 `/part/:id`、登录/注册、新建/编辑页。
- 瀑布流:CSS 多列(`column-count` + `break-inside: avoid`)实现错落卡片,懒加载图片。
- 主题:白/蓝/粉「糖果美术馆」方向,`frontend-design` skill 指导;蓝粉渐变强调、马卡龙色标签 chip。
- API 层封装 axios 实例,自动附带 JWT;媒体上传用 `FormData` 多文件。
- Nginx 配置:托管构建产物,`/api`、`/media` 反代到 `gallery-api:5000`。

### D7: 配置与 .gitignore

- 提交 `appsettings.Example.json`(含 Jwt Key 占位、InviteCode 占位、Storage 路径)。
- `.gitignore` 排除 `appsettings.json` 与 `storage/`。
- 前端构建时通过 Vite 环境变量注入 API 基地址(默认相对路径 `/api`,同域反代,免 CORS)。

## Risks / Trade-offs

- [SQLite 并发写入瓶颈] → 个人局域网使用并发极低;EF Core 默认短事务,足够。
- [工作流 JSON 过大撑爆请求] → 1MB 上限校验 + 前端编辑前体积提示。
- [大视频上传阻塞 Kestrel] → 放宽 Kestrel 限制(沿用 1GB 配置)+ 前端分块提示;局域网带宽充裕。
- [多对多导致级联删除复杂] → 删除作品/角色时先清理连接表(显式 EF 配置 `OnDelete` 行为)。
- [Nginx 缓存旧构建产物] → 前端构建产物带 hash 文件名;`try_files` 回退 index.html 支持 SPA 路由。
- [静态媒体文件无鉴权] → 局域网自用可接受;如需收紧,后续可改为鉴权中间件(记录为 Open Question)。

## Migration Plan

- 全新应用,无既有数据迁移。
- 首次启动 EF `Database.Migrate()` 自动建库(沿用 QANassistantServer 的容错迁移逻辑)。
- 回滚:删除容器与 `./storage` 卷即完全重置;或保留卷重建镜像。

## Open Questions

- 是否需要为静态媒体增加鉴权(当前局域网开放可接受)。
- 作品是否需要"复制为模板"(从既有作品快速新建)的功能。
