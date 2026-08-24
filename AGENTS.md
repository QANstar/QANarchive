# Agent 规则(AGENTS.md)

本文件给在此仓库工作的 AI 代理提供持久约定,适用于 `comfyui-gallery-server`、`comfyui-gallery-web` 与 `openspec/`。

## 自动提交

- **完成一段有意义的改动后自动提交**,无需用户再次提醒。典型触发点:
  - 实现完一个功能/修复一个 bug;
  - 完成一批相关联的源码/配置/产物编辑,且能通过构建或校验;
  - 完成一个 OpenSpec 变更的阶段(proposal/design/specs/tasks)或实现。
- **提交要小、聚焦、可回滚**:一个逻辑单元一个 commit,提交信息用清晰的动词开头(如 `feat:`、`fix:`、`chore:`、`docs:`、`refactor:`),简述做了什么。
- **提交前先验证**:后端 `dotnet build` 通过;前端至少 `tsc -b` 通过;能跑就顺手跑一下迁移/冒烟测试。
- **只提代码与产物,不提交机密与构建产物**:
  - 不提交 `**/appsettings.json`(含 Jwt 密钥/邀请码)、`storage/`、`node_modules/`、`dist/`、`bin/`、`obj/`、`*.log`(`.gitignore` 已排除)。
  - 不提交 `.tmp/`、`.npm-cache/` 等本地临时目录。
- 若改动混杂了不相关文件,按主题拆分后再提交;无法拆分时可先提交当前主题,并说明遗留项。
- 提交前用 `git status`/`git diff --cached` 复核将被提交的内容,确保无意外文件。

## 其他约定

- 遵循已有技术栈与代码风格:后端 ASP.NET Core 9 Minimal API + EF Core SQLite + JWT;前端 React (Vite) + TypeScript + Nginx。
- 变更走 OpenSpec 工作流:改动先有 `openspec/changes/<name>/` 的 proposal/design/specs/tasks;实现后按需更新并(经确认)归档。
- 新增后端模型/字段时同步生成 EF 迁移(`dotnet ef migrations add`),连同 `AppDbContextModelSnapshot` 一并提交。
