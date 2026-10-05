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

桌面采用连续侧栏与整块主工作区，曲库和页头融入同一画布，通过排版与留白组织内容。歌词保留封面流体背景；底部播放器与内容区对齐，不设独立阴影或限宽。播放速度、变速处理与网易云音质使用同一 coss Select 样式，默认原位展开；手机触摸或视口空间不足时由 Base UI 自动调整位置。手机通过「曲库 / 正在练习」切换工作区。账号连接放在弹窗里；切换页面不会卸载音频，网易云与本地音频互斥播放。

搜索结果和正在练习的歌曲可通过爱心收藏，「我的收藏」保存在当前浏览器的 `utabiyori:music-favorites:v1`，不向网易云账号同步，也不保存票据或音频地址。再次打开收藏时重新搜索并匹配歌曲 ID，获取新的播放权限；下架或无法匹配时保留收藏并提示。

歌词发光沿当前演唱进度移动，并平滑居中跟随。优先使用官方逐字时间；接口未授权或歌曲没有数据时，使用 AMLL 的句级歌词并标注「句级近似进度」，按句起止时间推进，不能作为真实逐字演唱时间。罗马音和翻译使用更大的学习字号。播放时封面背景使用 AMLL MeshGradient 流体渲染，暂停或隐藏练习区域后保留画面；系统减少动态效果时保持静态。在页面空白区域按空格播放 / 暂停；输入框、可编辑区域、按钮、滑块、选择器和打开的弹窗保留原有键盘行为，组合键、长按和输入法组合输入不触发播放。

底部「全屏播放」可收起导航、页头和曲库，让歌词占满工作区，保留播放控制和学习开关；网易云与本地音频均支持。点击退出或按 Esc 恢复原页面，进入与退出不中断音频。浏览器不支持系统全屏时使用窗口内全屏，并显示提示。

网易云播放器提供标准、极高、无损和 Hi-Res 音质选择，并展示供应商实际返回的档位、编码和码率。音质可用性取决于会员、版权与歌曲资源；切换后恢复位置与播放状态。它与「变速处理」选项分开。

本地音频和网易云歌曲默认使用 Signalsmith Stretch 的 WASM / AudioWorklet 保音高变速，可在底部「变速处理」中切换「高品质 / 原生」。首次播放需要读取并解码音频，跨域、兼容性或内存不足时自动回退并提示。时间轴、权限边界及验证方式见 [音频播放说明](docs/audio-playback.md)。

右上角「外观设置」支持浅色、深色、跟随系统，提供玫瑰、紫罗兰、海蓝、森林、琥珀五种预设主题色，也可通过颜色选择器或 HEX 自定义。主题色会按界面明暗调整明度，并选择按钮文字颜色。设置保存在 localStorage 的 `utabiyori:appearance:v1`，与课程进度独立。

手机导航完整展示四个入口，原创课程通过「选择课程 / 逐句练习」切换，当前句的朗读与掌握操作位于阅读列表前。手机底部播放器直接提供播放、切句和循环，「播放设置」展开速度、变速处理、网易云音质与全屏操作；歌词手动滚动后可选择「回到当前句」。字号、点击范围、键盘操作和动效约定见 [界面与交互](docs/interface.md)。

应用框架参考 Codex 的连续侧栏、整块画布与悬浮操作区；音乐布局参考 [shadcn/ui 的 inset 侧栏](https://ui.shadcn.com/docs/components/base/sidebar)、[Cider](https://github.com/ciderapp/Cider) 和 [Apple Music Web Clone](https://github.com/nhicung/apple-music-clone)，没有使用这些布局参考的源码或素材；基础控件仍使用现有 coss ui。
歌词和流体背景接入 [Apple Music Like Lyrics](https://github.com/amll-dev/applemusic-like-lyrics) 0.6.0。AMLL 负责显示与动效；音频、权限和慢速 DSP 由现有播放器负责。翻译与罗马音仍来自网易云，键盘定位和阅读可通过「歌词列表」进行。能力边界、格式转换及 AGPL 许可说明见 [AMLL 接入](docs/amll.md)。背景没有实现音频低频律动。

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
