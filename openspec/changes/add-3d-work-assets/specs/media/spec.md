## ADDED Requirements

### Requirement: 上传3D资源

系统 SHALL 允许已登录用户为 3D 类型作品上传 3D 源文件,支持 fbx / blender(.blend) / 压缩包(zip);每个资源只上传源文件,不再单独上传预览图。

#### Scenario: 上传fbx资源

- **WHEN** 用户上传 .fbx 文件
- **THEN** 系统保存资源,作品详情页提供该 fbx 的浏览器内交互预览

#### Scenario: 上传blender源文件

- **WHEN** 用户上传 .blend 文件
- **THEN** 系统保存资源,详情页提供下载,不提供交互预览

#### Scenario: 上传zip压缩包

- **WHEN** 用户上传 .zip 压缩包(含完整资源)
- **THEN** 系统保存资源,详情页提供下载

### Requirement: 3D资源文件类型与大小限制

系统 SHALL 校验 3D 资源文件的扩展名与大小:仅允许 fbx / blend / zip,fbx 单文件 ≤ 200MB,blend 与 zip 单文件 ≤ 900MB,multipart 总请求体 ≤ 1GB。

#### Scenario: 非法3D类型被拒

- **WHEN** 用户上传不允许的扩展名(如 .obj、.gltf、.stl)作为 3D 资源
- **THEN** 系统拒绝并返回 400 错误

#### Scenario: 超大资源被拒

- **WHEN** 用户上传超过对应类型大小上限的 3D 源文件
- **THEN** 系统拒绝并返回 413 或 400 错误

### Requirement: 作品缩略图公开访问

系统 SHALL 通过 `/media` 静态路由公开提供作品的缩略图(封面,含图片媒体与裁剪产物),供画廊卡片、列表与详情页渲染,无需登录。

#### Scenario: 未登录加载缩略图

- **WHEN** 客户端请求某个作品缩略图的 URL
- **THEN** 系统返回该图片,未登录访客可正常显示

### Requirement: 3D资源源文件需登录

系统 SHALL 要求 3D 资源源文件(fbx/blend/zip)与下载端点均需登录;源文件通过授权的 API 端点返回,前端 3D 查看器与下载均须携带 JWT。

#### Scenario: 登录后加载fbx到查看器

- **WHEN** 已登录客户端通过授权的文件端点请求某个 fbx 资源源文件
- **THEN** 系统返回该文件内容,前端 three.js 查看器加载渲染

#### Scenario: 未登录获取源文件被拒

- **WHEN** 未登录客户端请求 3D 资源源文件或下载链接
- **THEN** 系统返回 401 未授权错误

#### Scenario: 登录后下载3D资源

- **WHEN** 已登录用户请求某个 3D 资源的下载端点
- **THEN** 系统以该资源原始文件名作为附件返回下载
