# 网易云接入

前端的「网易云练习」提供扫码登录、搜索和分页、同步歌词、点击歌词跳转、慢速播放与逐句循环。原有原创课程和本地音频练习保持独立。

## 数据和音频来源

| 能力                             | 来源                                | 当前应用实测                                  |
| -------------------------------- | ----------------------------------- | --------------------------------------------- |
| 匿名登录、二维码授权和状态轮询   | 网易云官方开放平台                  | 已通过                                        |
| 歌曲搜索（含原始 ID 和版权信息） | 官方 `/search/song/get/v3`          | 已通过                                        |
| 歌词、翻译、罗马音               | 官方 `/song/lyric/get/v2`           | 已通过；附加文本取决于歌曲                    |
| 逐字歌词及对应翻译               | 官方 `/song/lyric/word/by/word/get` | 已接入；2026-10-06 当前应用返回 300，尚未授权 |
| 官方音频地址                     | 官方 `/song/playurl/get/v2`         | 当前应用返回 300：应用未授权当前接口          |
| 备用音频地址                     | api-enhanced 的网页播放请求         | 已返回音频并实际播放；测试歌曲为 30 秒试听    |

设置 `NETEASE_PLAYBACK_PROVIDER=hybrid` 后，官方接口出现应用权限限制时使用网易云网页播放接口；`official` 则只调用官方播放接口。官方搜索中的 `visible` 代表该开放应用的版权范围，混合模式的音频改按网页接口实际下发的权限判断。

`lyrics` 操作先获取逐行歌词，再尝试官方逐字接口。逐字接口的 `start`、`duration` 和 `suspend` 均为毫秒，`suspend` 是整首歌的绝对时间；服务端校验后统一转换为秒，返回 `wordLines`、`wordTranslation` 和安全的 `wordTiming` 状态。`ytlrcs` 是与逐字时间轴对齐的逐行翻译。逐字数据优先作为歌词时间轴，并按相同文本及邻近时间保留逐行接口的罗马音；没有匹配的附加文本不会生成或错配。

官方说明并非所有歌曲都有逐字歌词，无数据时可能返回 `data: null`。当前个人 CLI 应用调用该接口返回未授权。2026-10-06 核对官方个人接入 FAQ：个人应用仅支持 ncm-cli，不提供直接接入开放平台 API 的自助权限申请；厂商 API 接入需联系云音乐商务，并提交企业及产品资料接受评估。会员资格不能代替开放应用授权。权限不足、无数据或临时请求失败时保留逐行歌词，并在界面标注「句级跟随」，说明降级原因；授权过期仍按原有重新登录流程处理。没有改用非官方歌词接口。

歌词与流体背景通过 AMLL 渲染，转换及同步细节见 [AMLL 接入](amll.md)。官方逐字时间直接转换为整数毫秒；没有数据时保留句级跟随，不均分字符或伪装逐字时间。

官方曲库授权与网页登录是两个独立会话。先扫码连接官方曲库，再点击「扫码连接网页播放」，用网易云 App 确认第二个二维码。备用音频随后使用网页登录账号的会员和购买权限；未连接时仍按游客权限播放。完成网页登录后会自动重试当前歌曲。没有会员、购买权限或受到地区和版权限制的歌曲仍可能无法完整播放。

备用实现依赖固定版本 `@neteasecloudmusicapienhanced/api@4.41.0` 的加密模块，来自 [api-enhanced](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)。HTTP 请求由应用发送，仅用于网页登录和歌曲播放，不启用解锁、其他平台匹配或公共第三方代理。请求和返回的 Cookie 不写入日志。它属于非官方接口，可能因网易云接口变动或部署环境而失效。

播放器保留并限制 `freeTrail` / `freeTrialInfo` 指定的试听范围。音频通过网易云 HTTPS CDN 直接播放，地址不写入 localStorage，不下载或持久缓存。官方音频播放事件按文档回传；网页游客音频不会混入官方 OAuth 账号的播放记录。

## 接口权限与申请入口

当前账号的「应用管理」只有应用详情，没有逐字歌词权限申请按钮。官方 [个人接入 FAQ](https://developer.music.163.com/st/developer/document?docId=3b75ab8e475d41ca93d91ebd4dfd383f) 明确说明个人应用仅提供 ncm-cli，厂商接入需联系云音乐商务。

根据 [厂商开发者入驻指南](https://developer.music.163.com/st/developer/document?docId=4313d6b51e6f42e0824a3c56a628a785)，需提供企业信息、产品核心功能、市场定位、终端类型及合作诉求；音乐服务不是免费提供，项目通常在 3–5 个工作日内完成合作评估。指南没有提供个人应用单独申请逐字歌词权限的表单，也没有承诺商务接入后一定开放该接口。

若要继续咨询，可通过网易云音乐 App 内客服通道，请求转接开放平台商务：说明项目「歌日和」用于日语歌曲逐句学习，需要确认网页应用接入和 `/openapi/music/basic/song/lyric/word/by/word/get` 的授权条件、费用及申请流程。仅提供 AppID 和项目用途；不要发送 AppSecret、私钥或用户会话。尚未获授权时继续使用官方逐行歌词。

## 网易云音质

底部「网易云音质」使用标准 `standard`、极高 `exhigh`、无损 `lossless`、Hi-Res `hires` 四档；「变速处理」单独控制 DSP / 浏览器原生模式。服务端校验允许的档位，不接受任意供应商参数。网页音频沿用同一 `/api/song/enhance/player/url/v1` 接口，将原来的固定 `standard` 改为所选 `level`；音质仍由网易云按当前网页登录账号、会员及歌曲版权决定，不启用解锁或其他歌曲匹配。

标准 / 极高保留官方优先与网页回退流程，官方请求码率分别为 128 / 320 kbps；无损 / Hi-Res 在 hybrid 模式下直接请求网页音频。仅官方模式仍按官方可用码率处理。客户端显示真实返回的 `level`、编码及 kbps；供应商未提供档位时显示「供应商未标注」，不能将请求值当作实际音质。供应商降级时明确提示；没有音频时保留错误处理与试听限制。

切换音质获取新的短期播放地址，保留歌词和原曲位置、倍速、音量、逐句循环及播放 / 暂停状态；旧请求在切歌或退出时取消，不得覆盖新歌曲。无损文件可能增大首次 DSP 解码耗时，浏览器无法解码时仍显示现有音频错误，不伪称已播放无损。增强库的音质参数见 [上游实现](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced/blob/main/module/song_url_v1.js)。

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

网页登录的 `MUSIC_U` / `__csrf` 另存于 `utabiyori_ncm_web` 加密 HttpOnly Cookie，绑定当前官方会话的设备 ID，有效期最多七天，不配置成全站共享环境变量。二维码和轮询响应仅返回 URL、过期时间或状态，不返回网页登录凭据。「断开网页播放」只清除本应用当前浏览器的网页会话；「退出登录」同时清除两个会话。不同账号的权限不会共享。

官方搜索结果的原始 ID、时长和加密 ID 由服务端签发短期票据，备用音频只接受通过验证的映射，防止将另一首歌的音频与当前歌词混用。POST 验证同源 Origin，并限制请求体、参数和每实例每 IP 的请求频率。该频率限制不跨 Serverless 实例共享；公开推广前，应在 Vercel 防火墙或共享存储中增加统一配额保护（当前应用日配额为 5,000 次）。

## Vercel

Root Directory 使用仓库根目录。`api/netease.ts` 是 Node Serverless 入口，前端继续输出到 `apps/web/dist`。在 Vercel 的 Environment Variables 中配置与本地相同的服务端变量，再部署。不要上传本地 `.env.local`，也不要把用户登录 token 配置成全站共享变量。

根目录提供 TypeScript 和 Node 类型依赖，以及供 Vercel 函数编译使用的 `tsconfig.json`。其中 `rewriteRelativeImportExtensions` 将服务端源码的 `.ts` 相对引用改成部署产物的 `.js` 引用，避免函数启动时找不到模块。

2026-10-05 已部署到 [歌日和](https://jp-learn-delta.vercel.app/)，线上验证了授权会话、官方搜索、歌词与备用音频实际播放（含 0.75× 变速）。首次部署的游客播放中，`lemon中文版(cover时代少年团)` 可播放，米津玄師的 `アイネクライネ` 和 `Lemon` 没有返回音频。

补充网页登录后，使用真实会员网页会话在本地和 Vercel 验证了 LONGMAN 的 `spiral`（原始 ID `2057696725`）：约 231 秒完整音频、56 行歌词、0.75× 实际播放，无试听限制。二维码生成及等待扫码状态通过真实接口验证，授权成功时的 Cookie 提取、会话隔离和退出逻辑另有自动化测试。本地能试听不代表 Vercel 上也可用，其他歌曲仍取决于网易云实际下发的权限和部署环境。

## 验证

`pnpm typecheck`、`pnpm lint`、`pnpm test` 和 `pnpm build` 检查类型、签名、Cookie 防篡改、同源边界、歌曲映射票据及歌词时间轴。真实接口和浏览器验证需要扫码登录，且当地网络、账号与版权范围会影响结果。罗马音和翻译只显示官方提供的文本；没有自动生成假名、翻译或音准评分。

官方文档：[签名](https://music.163.com/st/developer/document?docId=45aac8d12ccb4a98b14e2ea34a1a9cdb)、[公共参数](https://music.163.com/st/developer/document?docId=0f7801d7d6d24180b8fc9058d1ffe593)、[歌曲搜索](https://music.163.com/st/developer/document?docId=b175e0d52550427cbb7cd4735a9de765)、[歌词](https://music.163.com/st/developer/document?docId=803202bd65bc469587d05b507dcd31e7)、[逐字歌词](https://music.163.com/st/developer/document?docId=ac69c8c9c1b04a7f8704d6ccb78580dc)、[播放地址](https://music.163.com/st/developer/document?docId=3d2c9f695ff24f4ea37611614b7f7856)。
