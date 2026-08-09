# QAN Gallery · ComfyUI 作品收藏站

自托管的 ComfyUI 作品收藏站:归档生成的图片/视频、prompt 与工作流 JSON,支持按**角色(合集)**与**部件库(提示词部件)**整理。纯局域网自用,内容全局共享可见。

```
┌─────────────────────┐      ┌──────────────────────┐
│  comfyui-gallery-web │      │ comfyui-gallery-server│
│  React + Vite + Nginx│─────▶│  ASP.NET Core 9      │
│  :80                 │      │  Kestrel :5000       │
│  /api·/media 反代     │◀─────│  /api/*  /media/*    │
└─────────────────────┘      └──────────┬───────────┘
                                        │
                               ┌────────▼──────────┐
                               │  ./storage 卷      │
                               │  data/app.db      │
                               │  media/...        │
                               └───────────────────┘
```

## 技术栈

| 组件 | 方案 |
|------|------|
| 前端 | React 18 + TypeScript + Vite,由 Nginx 托管 |
| 后端 | .NET 9 ASP.NET Core Minimal API |
| 数据库 | SQLite (EF Core) |
| 认证 | JWT Bearer (HMAC-SHA256) + 邀请码注册 |
| 密码哈希 | ASP.NET Core Identity `PasswordHasher` |
| 容器化 | Docker + docker-compose,`./storage` 卷持久化 |

## 快速开始

### Docker 部署(推荐)

```bash
# 1. 复制配置模板并修改(密钥与邀请码)
cp comfyui-gallery-server/appsettings.Example.json comfyui-gallery-server/appsettings.json

# 2. 编辑 appsettings.json,至少修改:
#    Jwt:Key     — openssl rand -base64 64
#    InviteCode  — 你的注册邀请码

# 3. 构建并启动
docker-compose up -d --build
# 前端 http://<局域网IP>  后端 http://<局域网IP>:5000
```

首次启动自动创建数据库并迁移。数据(数据库 + 媒体文件)持久化在 `./storage`,重启不丢;备份只需拷贝该目录。

### 本地开发

```bash
# 后端(端口 5000)
cd comfyui-gallery-server
cp appsettings.Example.json appsettings.json   # 修改 Jwt:Key 与 InviteCode
dotnet run

# 前端(端口 5173,/api 与 /media 已代理到 5000)
cd comfyui-gallery-web
npm install
npm run dev
```

## 配置说明

`appsettings.json`(已 `.gitignore`)由 `appsettings.Example.json` 模板生成:

| 配置项 | 说明 |
|--------|------|
| `Jwt:Key` | JWT 签名密钥,生成:`openssl rand -base64 64` |
| `Jwt:Issuer/Audience` | Token 签发方/接收方标识 |
| `Jwt:ExpireHours` | Token 有效期,默认 720 小时(30 天) |
| `InviteCode` | 注册邀请码,注册时必须匹配 |
| `Storage:DataDir` | SQLite 数据库目录,默认 `storage/data` |
| `Storage:MediaDir` | 媒体文件目录,默认 `storage/media` |

## 功能

- **作品(Work)**:核心实体。标题、prompt、简介、可选 ComfyUI 工作流 JSON、标签、多张图片/视频;纯视频作品可手动上传封面。
- **角色(Character)**:合集包装。角色设定 prompt + 预览图 + 简介 + 标签;作品↔角色为多对多,**不勾任何角色 = 直接传图**。
- **部件库(Part)**:可复用提示词片段(发型/服装/配饰…),带分类与预览图;作品可**可选关联**用到的部件,追溯"怎么做出来的"。
- **画廊**:首页瀑布流 + 作品/角色/部件 tab + 热门标签筛选(AND)+ 关键词搜索 + 无限滚动。
- **用户系统**:邀请码注册 + JWT 登录;浏览公开、写入需认证。

## API 概览

| 组 | 端点 | 说明 |
|----|------|------|
| `/api/auth` | register / login | 注册(带邀请码)/ 登录 |
| `/api/works` | CRUD + media 上传/删除/排序 + 封面上传/指定 | 需认证 |
| `/api/characters` | CRUD + 预览图 + 追加/移除合集作品 + `/all` 轻量列表 | 需认证 |
| `/api/parts` | CRUD + 预览图 + `/all` 轻量列表 | 需认证 |
| `/api/tags` | `/hot` 热门标签 | 公开 |
| `/api/gallery` | 瀑布流浏览(`tab`/`search`/`tags`/`category`/`page`) | 公开 |
| `/media/*` | 静态媒体文件 | 公开 |
| `/api/health` | 健康检查 | 公开 |

## 目录结构

```
QANarchive/
├── docker-compose.yml            # 双服务编排
├── comfyui-gallery-server/       # ASP.NET Core 后端
│   ├── Endpoints/                # 各模块 API
│   ├── Models/  DTOs/  Services/ # 模型 / 传输对象 / 服务
│   ├── Data/                     # EF Core DbContext + 迁移
│   └── appsettings.Example.json  # 配置模板(实际配置 gitignore)
└── comfyui-gallery-web/          # React 前端
    ├── src/pages/                # 页面
    ├── src/components/           # 通用组件
    └── nginx.conf                # 静态托管 + API 反代
```
