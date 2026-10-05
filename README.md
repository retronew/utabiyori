# 歌日和 · jp-learn

围绕「听 → 跟读 → 跟唱 → 认识假名」的日语学习应用。适合已经能听懂一点日语、但容易卡在五十音的学习者。无需先背完五十音，每句只认识少量假名，再逐渐关掉罗马音。

## 启动

需要 Node.js 22.12+（推荐 Node.js 24）和 pnpm 11.24.0。

```sh
pnpm install
pnpm dev
```

打开终端给出的地址，默认 http://localhost:5173。

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## 部署到 Vercel

线上地址：[歌日和](https://jp-learn-delta.vercel.app/)。

仓库根目录提供 `vercel.json`，构建命令为 `pnpm --filter @jp-learn/api build && pnpm --filter @jp-learn/web build`，输出目录为 `apps/web/dist`。API 先编译到 `apps/api/dist`，供 Vercel Functions 使用。在 Vercel 中使用仓库根目录作为 Root Directory，保留完整 workspace 即可安装内部依赖。

首次部署在仓库根目录执行：

```sh
pnpm dlx vercel login
pnpm dlx vercel deploy --prod
```

按照提示选择账号并创建或关联项目。后续更新继续执行 `pnpm dlx vercel deploy --prod`。原创课程无需环境变量；网易云功能需要配置根目录 `.env.example` 中的服务端变量，详见 [网易云接入](docs/netease.md)。学习进度和导入课程仍按浏览器保存，线上域名与 localhost 的进度独立。

## Monorepo 结构

| 路径               | 职责                                                                |
| ------------------ | ------------------------------------------------------------------- |
| `apps/web`         | React + TypeScript + Vite：学习界面、浏览器语音、本地音频、进度保存 |
| `apps/api`         | 网易云官方签名、扫码授权、加密会话、搜索与歌词、备用网页播放        |
| `api/netease.ts`   | Vercel Node Serverless 入口；本地通过 Vite 中间件调用同一服务       |
| `packages/content` | 原创练习内容、假名注音、罗马音、中文释义、发音提示                  |
| `packages/shared`  | 内容类型、导入校验、进度键、完成率、音频循环范围验证                |

内部包通过 `workspace:*` 引用，直接导出 TypeScript 源码供 Vite 构建。新增应用放在 `apps/*`，新增共享模块放在 `packages/*`。

组件拆分、包边界、导入、主题、音频生命周期和验证规范见 [AGENTS.md](AGENTS.md)。

包内导入使用 `#`，不在 `#` 后加 `/`，例如 `#components/ui/button`、`#lib/theme`、`#client`；跨包使用 `@jp-learn/shared`、`@jp-learn/api/handler` 等包名。每个包通过 `package.json` 的 `imports` 声明内部映射，跨包入口通过 `exports` 声明。Vite 和 Node 使用原生包映射，避免全局 `#` 别名影响依赖包自己的内部导入。

API 的公共入口通过 `types` 条件供 TypeScript 解析源码，`source` 条件供开发与测试使用，默认条件指向编译后的 JavaScript。Web 开发和构建脚本自动启用 `source` 条件；API 使用 esbuild 将内部 `#` 导入及必要依赖打包到 `dist/handler.js`，生产函数读取这个入口。

## 前端界面与主题

前端使用 Tailwind CSS 4 和 [coss ui](https://coss.com/ui)，组件基于 Base UI，源码放在 `apps/web/src/components/ui`。布局、交互状态和响应式样式主要使用 class；`index.css` 只保留主题变量、全局样式与减少动态效果规则。来源与许可见 [第三方声明](THIRD_PARTY_NOTICES.md)。

桌面采用侧栏、曲库列表与练习区域分栏，歌词列表独立滚动，底部统一播放器提供变速、跳转、音量和逐句循环。手机通过「曲库 / 正在练习」切换工作区。账号连接放在弹窗里；切换页面不会卸载音频，网易云与本地音频互斥播放。

右上角「外观设置」支持浅色、深色、跟随系统，提供玫瑰、紫罗兰、海蓝、森林、琥珀五种预设主题色，也可通过颜色选择器或 HEX 自定义。主题色会按界面明暗调整明度，并选择按钮文字颜色。设置保存在 localStorage 的 `utabiyori:appearance:v1`，与课程进度独立。

布局参考 [Cider](https://github.com/ciderapp/Cider) 和 [Apple Music Web Clone](https://github.com/nhicung/apple-music-clone)，没有使用它们的源码或素材。

## 第一版功能

- 三组原创短句，逐句切换，汉字假名注音，可隐藏罗马音和释义。
- 日语正常/慢速朗读，单个假名试听；系统没有日语语音时提示安装。
- 标记每句熟练度，本地保存，已学会的句子进入复习列表。
- 选择本地音频，0.6× / 0.75× / 0.9× / 1× 播放，自定义 A–B 循环区间。
- 下载逐句练习示例，填入自己的歌词和注音后导入；导入课程保存在本机，刷新后仍可使用。
- 桌面和手机布局、键盘焦点、减少动态效果支持。
- 网易云官方扫码授权、歌曲搜索和同步歌词；可选择混合音频来源，逐句跳转、变速和循环，限制在实际可播放片段内。配置及限制见 [网易云接入](docs/netease.md)。

## 建议练习方式

1. 先听一小句，打开罗马音和中文，确认声音和意思。
2. 看假名跟读，了解这一句的两个假名和发音提示。
3. 关掉罗马音，试着读出来；能独立读时标记「这句我会了」。
4. 选择自己的歌曲音频，手动设定片段起止位置，慢速循环跟唱。
5. 每天从复习列表回顾已学会的句子。

## 内容和数据

页面提供「下载逐句练习示例」和「导入逐句练习」入口，示例在 `apps/web/public/lesson-template.json`。填写歌词、假名、罗马音和释义即可导入一份课程（最多 200 句，文件不超过 1 MB）。课程和句子的 `id` 使用字母、数字、短横线或下划线，保持唯一；重复课程不会覆盖已有内容。该版本需要手动整理注音和释义。

内置内容为原创日语练习短句，没有旋律和人声录音。系统语音是朗读，不是歌唱；选择本地歌曲后，音频与内置练习句不会自动同步。第一版没有歌词自动识别、音准评分、账户或云端同步。

在 `packages/content/src/index.ts` 中新增 `Song` 数据即可扩充课程。每句包含稳定的 `id`、分词注音 `tokens`、完整 `kana`、`romaji`、`translation`、`tip` 和 `focus` 假名卡。助词读音需按语境填写，例如「君へ」对应 `kimi e`。

进度保存在浏览器 localStorage 的 `jp-learn:progress:v1`，以 `歌曲id:句子id` 为键；清除站点数据会清除进度。本地音频使用临时对象 URL，不上传、不持久保存，刷新后需重新选择。界面使用系统字体。

## 后续方向

支持逐句时间轴，将音频片段与课程绑定；加入录音回听和假名复习，再考虑自动注音及更完整的课程管理。

构建方式参考 [pnpm workspace 文档](https://pnpm.io/workspaces) 与 [Vite 文档](https://vite.dev/guide/)。
