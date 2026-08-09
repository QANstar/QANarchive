## 1. 项目脚手架与配置

- [x] 1.1 在 QANarchive 下创建 `comfyui-gallery-server`(ASP.NET Core 9 Minimal API)与 `comfyui-gallery-web`(React + Vite + TS)两个目录
- [x] 1.2 创建后端 `appsettings.Example.json`(Jwt Key/Issuer/Audience/ExpireHours、Storage 路径、InviteCode)并生成 `.gitignore`(排除 `appsettings.json`、`storage/`)
- [x] 1.3 创建后端 Dockerfile(多阶段:build → runtime,暴露 5000)与前端 Dockerfile(Nginx 托管构建产物)
- [x] 1.4 创建根级 `docker-compose.yml`(gallery-web :80 + gallery-api :5000,挂载 `./storage` 卷,Nginx 反代 `/api` 与 `/media`)

## 2. 后端:基础设施

- [x] 2.1 `Program.cs`:SQLite 连接、JWT Bearer 认证、CORS、Kestrel 1GB 上传限制、`/api/health` 健康检查、启动时 `Database.Migrate()`(含容错迁移逻辑)
- [x] 2.2 定义模型:User / Character / Work / Media / Part / Tag 及连接表 CharacterWork、WorkPart、CharacterTag、WorkTag、PartTag
- [x] 2.3 `AppDbContext.OnModelCreating`:唯一索引(Tag.Name、User.Account)、索引(Work.CreatedAt、Tag.UsageCount、连接表联合主键)、多对多与级联删除配置
- [x] 2.4 生成并应用 EF Core 初始迁移(`dotnet ef migrations add InitialCreate`)
- [x] 2.5 实现 `JwtService` 与 `PasswordService`(沿用 QANassistantServer 实现)
- [x] 2.6 定义 DTO 与映射(列表项摘要、详情、创建/更新请求、分页响应)

## 3. 后端:认证

- [x] 3.1 `AuthEndpoints`:注册(校验邀请码、用户名/账号/密码、重复账号 409)与登录(签发 JWT)
- [x] 3.2 为写入接口统一挂载 `RequireAuthorization()`,浏览接口保持公开

## 4. 后端:核心模块 API

- [x] 4.1 `WorksEndpoints`:作品 CRUD,含 prompt、workflowJson(≤1MB 校验)、简介、标签
- [x] 4.2 作品媒体:多文件上传、单个媒体删除、媒体排序、封面管理(默认第一张图/视频手动封面)
- [x] 4.3 作品关联:角色多对多增删、部件多对多增删(编辑时整组替换)
- [x] 4.4 `CharactersEndpoints`:角色 CRUD + 预览图上传/更换 + 从角色页追加/新建作品
- [x] 4.5 `PartsEndpoints`:部件 CRUD + 分类 + 预览图上传/更换 + 按分类筛选
- [x] 4.6 `TagsEndpoints`:热门标签(按 UsageCount 降序)与标签使用计数维护
- [x] 4.7 `GalleryEndpoints`:画廊浏览(分页 + search + tags AND 筛选 + tab=works/characters/parts)
- [x] 4.8 静态媒体服务:映射 `/media` 路由,磁盘存储 `storage/media/{works|characters|parts}/{entityId}/…`
- [x] 4.9 文件校验:图片(jpg/png/webp/gif ≤50MB)与视频(mp4/webm ≤500MB)扩展名白名单与大小限制

## 5. 前端:基础设施与主题

- [x] 5.1 搭建 Vite + React + TS 工程,配置路由(首页/详情/角色页/部件页/登录注册/新建编辑)
- [x] 5.2 实现 axios API 客户端(自动附带 JWT、FormData 上传)与认证状态管理(登录态、路由守卫)
- [x] 5.3 按白/蓝/粉「糖果美术馆」方向建立主题:CSS 变量、字体、蓝粉渐变、马卡龙色标签 chip、全局样式
- [x] 5.4 实现通用组件:瀑布流卡片(懒加载)、分页/无限滚动、标签选择器、图片/视频上传组件、prompt 一键复制

## 6. 前端:页面

- [x] 6.1 首页画廊:作品/角色/部件 tab 切换 + 热门标签 chips + 关键词搜索 + 瀑布流与滚动加载
- [x] 6.2 作品详情页:媒体墙(图片/视频播放器)、完整 prompt、工作流 JSON 查看/复制/下载、关联角色与部件
- [x] 6.3 作品新建/编辑页:字段表单、多文件上传、封面选择、角色/部件多选关联
- [x] 6.4 角色页:角色设定 prompt、预览图、标签展示 + 合集内作品 + 追加/新建作品入口
- [x] 6.5 角色与部件的新建/编辑页(含预览图上传)
- [x] 6.6 部件库页:分类 tab + 部件卡片 + 点击进入详情/编辑
- [x] 6.7 登录/注册页(注册含邀请码输入)与全局导航(logo、搜索入口、新建按钮)

## 7. 部署与端到端验证

- [x] 7.1 本地开发联调:后端 `dotnet run` + 前端 `vite dev`,验证注册→登录→建角色→建部件→传作品→画廊展示全链路
- [x] 7.2 验证各 spec 场景:多角色关联、直接传图、部件关联、视频封面、tag AND 筛选、分页、热门标签
- [ ] 7.3 Docker 构建与 Compose 启动,验证 `./storage` 卷持久化(重启后数据仍在)与 Nginx 反代
- [ ] 7.4 对照 README 补全部署文档(本地开发、Docker、配置说明)
