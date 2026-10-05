# 网易云接入

前端的「网易云练习」提供扫码登录、搜索和分页、同步歌词、点击歌词跳转、慢速播放与逐句循环。原有原创课程和本地音频练习保持独立。

## 数据和音频来源

| 能力                             | 来源                        | 当前应用实测                               |
| -------------------------------- | --------------------------- | ------------------------------------------ |
| 匿名登录、二维码授权和状态轮询   | 网易云官方开放平台          | 已通过                                     |
| 歌曲搜索（含原始 ID 和版权信息） | 官方 `/search/song/get/v3`  | 已通过                                     |
| 歌词、翻译、罗马音               | 官方 `/song/lyric/get/v2`   | 已通过；附加文本取决于歌曲                 |
| 官方音频地址                     | 官方 `/song/playurl/get/v2` | 当前应用返回 300：应用未授权当前接口       |
| 备用音频地址                     | api-enhanced 的网页播放请求 | 已返回音频并实际播放；测试歌曲为 30 秒试听 |

设置 `NETEASE_PLAYBACK_PROVIDER=hybrid` 后，官方接口出现应用权限限制时使用网易云网页播放接口；`official` 则只调用官方播放接口。官方搜索中的 `visible` 代表该开放应用的版权范围，混合模式的音频改按网页接口实际下发的权限判断。网页请求仅使用游客权限，不会自动继承官方 OAuth 账号的 VIP 权益。会员完整播放需要另一套网页版登录 Cookie，目前未实现该登录流程。

备用实现依赖固定版本 `@neteasecloudmusicapienhanced/api@4.41.0` 的请求模块，来自 [api-enhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)。仅调用歌曲播放接口，不启用解锁、其他平台匹配或公共第三方代理。它属于非官方接口，可能因网易云接口变动或部署环境而失效。

播放器保留并限制 `freeTrail` / `freeTrialInfo` 指定的试听范围。音频通过网易云 HTTPS CDN 直接播放，地址不写入 localStorage，不下载或持久缓存。官方音频播放事件按文档回传；网页游客音频不会混入官方 OAuth 账号的播放记录。

## 本地配置

将根目录 `.env.example` 复制为 `.env.local`，填写以下环境变量：

- `NETEASE_APP_ID`、`NETEASE_APP_SECRET`、`NETEASE_PRIVATE_KEY`：开放平台凭据。私钥支持 PKCS8 base64 或 PEM，PEM 换行可以写成 `\n`。
- `NETEASE_PUBLIC_KEY`：保留应用公钥；普通请求签名使用私钥，当前接口不需要用公钥加密。
- `NETEASE_SESSION_SECRET`：至少 32 字符的随机服务端密钥；可按模板中的 Node 命令生成。
- `NETEASE_DEVICE_*`：当前个人 CLI 应用使用 `openapi` 设备类型与 `ncmcli` 的 os/channel/brand。其他应用类型需核对网易云分配的参数。
- `NETEASE_PLAYBACK_PROVIDER`：`hybrid` 或 `official`。

执行 `pnpm dev`。Vite 的开发中间件读取仓库根目录的配置并提供 `/api/netease`。这些值没有 `VITE_` 前缀，不会进入前端构建。环境文件和密钥文件均被 Git 和 Vercel 上传规则排除。

## 服务端与会话

`apps/api/src/client.ts` 按 ASCII 排序未编码的参数，用 RSA-SHA256 签名，再进行表单编码。所有业务接口和参数由服务端限定，浏览器不能把这个服务当成任意签名代理。

用户和匿名 token、待确认二维码、当前播放权限放在 AES-256-GCM 加密的 HttpOnly Cookie 中，使用 SameSite=Lax，Vercel 部署时启用 Secure。不同浏览器使用不同设备 ID。匿名 token 用于二维码轮询；用户 token 过期后尝试官方刷新，失败则重新登录。令牌不进入响应 JSON、localStorage 或日志。

官方搜索结果的原始 ID、时长和加密 ID 由服务端签发短期票据，备用音频只接受通过验证的映射，防止将另一首歌的音频与当前歌词混用。POST 验证同源 Origin，并限制请求体、参数和每实例每 IP 的请求频率。该频率限制不跨 Serverless 实例共享；公开推广前，应在 Vercel 防火墙或共享存储中增加统一配额保护（当前应用日配额为 5,000 次）。

## Vercel

Root Directory 使用仓库根目录。`api/netease.ts` 是 Node Serverless 入口，前端继续输出到 `apps/web/dist`。在 Vercel 的 Environment Variables 中配置与本地相同的服务端变量，再部署。不要上传本地 `.env.local`，也不要把用户登录 token 配置成全站共享变量。

## 验证

`pnpm typecheck`、`pnpm lint`、`pnpm test` 和 `pnpm build` 检查类型、签名、Cookie 防篡改、同源边界、歌曲映射票据及歌词时间轴。真实接口和浏览器验证需要扫码登录，且当地网络、账号与版权范围会影响结果。罗马音和翻译只显示官方提供的文本；没有自动生成假名、翻译或音准评分。

官方文档：[签名](https://music.163.com/st/developer/document?docId=45aac8d12ccb4a98b14e2ea34a1a9cdb)、[公共参数](https://music.163.com/st/developer/document?docId=0f7801d7d6d24180b8fc9058d1ffe593)、[歌曲搜索](https://music.163.com/st/developer/document?docId=b175e0d52550427cbb7cd4735a9de765)、[歌词](https://music.163.com/st/developer/document?docId=803202bd65bc469587d05b507dcd31e7)、[播放地址](https://music.163.com/st/developer/document?docId=3d2c9f695ff24f4ea37611614b7f7856)。
