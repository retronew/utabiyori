# 歌日和账号与同步

歌日和使用 Vercel 作为身份提供方，使用 Neon PostgreSQL 保存应用数据。登录后以经过签名验证的 `issuer + subject` 映射到内部用户 ID，不依赖浏览器传来的昵称或邮箱判断归属。每个使用者只需点击「使用 Vercel 登录」；应用所有者需要配置一次 Vercel Login App 和数据库。

## 同步范围

同步学习进度（包括取消掌握）、导入的自定义课程、音乐收藏元数据和外观设置。网易云授权由原有音乐会话管理；歌曲票据、音频地址、网易云凭据及本地音频文件不进入同步文档。播放器当前曲目、播放位置、倍速和临时面板状态不在此版本的同步范围内。

未登录时沿用原来的 localStorage key：`jp-learn:progress:v1`、`jp-learn:library:v1`、`utabiyori:music-favorites:v1`、`utabiyori:appearance:v1`。首次登录不自动把本机数据归给账号，账号弹窗会提供明确的合并操作。退出恢复游客数据，原始游客数据不被账号数据覆盖。

合并时保留云端已有的掌握状态和主题，补充本机收藏、课程及不存在的进度。同一课程 ID 内容不同则保留两份，为本机版本生成稳定的新 ID，并迁移对应进度；重复合并不会生成多份副本。单账号上限为 500 首收藏、50 份自定义课程、10000 条进度以及 2 MB 的规范化 JSON。

## 服务配置

1. 在 Vercel 团队设置创建 Login App，启用 Authorization Code，允许 `openid profile`；配置精确回调地址 `http://localhost:5173/api/auth/callback` 和 `https://你的域名/api/auth/callback`。不需要启用邮件、离线授权或团队与项目管理权限。
2. 通过 Vercel Marketplace 创建并连接 Neon PostgreSQL。数据库连接只用于服务端，此应用不依赖 Neon Auth。
3. 本地根目录 `.env.local` 和 Vercel 的对应环境配置以下变量，示例见根 `.env.example`：

| 变量                       | 用途                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `VERCEL_APP_CLIENT_ID`     | Vercel Login App 客户端编号                                                                             |
| `VERCEL_APP_CLIENT_SECRET` | 客户端密钥                                                                                              |
| `APP_SESSION_SECRET`       | 至少 32 个字符的随机密钥，用于加密临时 OAuth 状态                                                       |
| `DATABASE_URL`             | Neon 连接串，保留 TLS 参数                                                                              |
| `APP_ORIGIN`               | 可选的规范站点 origin，不能带末尾 `/`；生产默认使用 `VERCEL_PROJECT_PRODUCTION_URL`，本地默认 localhost |

所有变量均为服务端配置，不添加 `VITE_` 前缀。Preview 未连接数据库时展示未配置状态；若需要预览登录，应单独连接测试数据库、配置 origin 和对应回调，不能借用生产站点的登录 Cookie。

首次创建表，在仓库根目录执行：

```sh
pnpm --filter @jp-learn/api db:migrate
```

脚本读取根 `.env.local` 的数据库连接，在事务中执行 `apps/api/migrations/001-account.sql`。表创建可以重复执行；后续结构变更应添加独立迁移，不要把 `CREATE TABLE IF NOT EXISTS` 当作升级已有表的工具。HTTP 请求不负责修改数据库结构。

## 登录与同步流程

`/api/auth/authorize` 生成 state、nonce、PKCE S256，并将临时状态加密存入 HttpOnly Cookie。回调校验 state 与 origin，服务端交换授权码，并校验 ID Token 的 RS256 签名、issuer、audience、有效期及 nonce。供应商令牌不返回前端，也不保存到同步文档。服务端创建 7 天随机应用会话，数据库只保存其 SHA-256 摘要；退出立即撤销当前会话。

`GET /api/auth/session` 返回当前应用用户，`POST /api/auth/logout` 退出；`GET /api/account` 读取该会话用户的文档，`POST /api/account` 接收 `userId、revision、mutationId、data`。写入前将请求 userId 与会话用户核对，避免另一标签切换账号后将旧缓存写入新账号。POST 必须来自本站 origin。登录和文档访问有数据库限流，不依赖 Serverless 进程内存。

每个用户有一份 JSONB 文档和递增版本。客户端把修改记录到 `utabiyori:account:<内部用户ID>:v1` 的独立缓存队列，写入使用数据库比较版本更新。冲突返回 409 和当前文档；客户端在最新文档上重放尚未确认的操作，再提交。提交编号与更新在同一数据库语句中保存，丢失响应后重试不会重复应用操作。

当前页面离线时修改仍先保存到对应账号缓存，联网、重新聚焦、手动同步或每 30 秒检查时尝试同步。浏览器存储不可用时显示错误，不假称修改已保存。离线刷新无法确认会话时先显示游客数据，账号缓存仍保留，恢复联网后重新连接。清除站点存储会清除尚未上传的修改；已确认的云端数据可重新下载。

## 运维与验证

`app_users` 保存用户映射，`app_sessions` 保存会话摘要，`app_data` 保存版本文档，`app_mutations` 保存重试凭据，`app_rate_limits` 保存分钟限流窗口。生产运维可以定期清理过期会话和长期未使用的限流行；不要随意清除重试凭据，否则长期离线的旧请求可能再次生效。数据库应保持私有访问，不为浏览器公开连接串。

上线前运行根目录 typecheck、lint、test、format:check、build、git diff --check，并验证 API bundle 独立加载。真实服务验收包括 Vercel 授权回调、刷新恢复登录、进度同步、退出、游客合并、双端冲突与账号切换隔离。自动化测试覆盖数据清洗、ID Token 安全校验、合并幂等性和离线队列；模拟通过不等于线上部署验证通过。
