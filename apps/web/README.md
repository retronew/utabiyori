# @jp-learn/web

歌日和的 React + TypeScript + Vite 应用，使用 Tailwind CSS 4 和 coss ui。

`App` 组合导航与工作区，`components/layout` 放侧栏与页头，`components/lessons` 放课程与复习，`components/netease` 放曲库、歌词与账号弹窗，`components/local` 放本地循环编辑器。业务状态、扫码轮询和媒体生命周期在 `hooks`，纯计算与事件协议在 `lib`。

`components/ui` 为 coss ui 基础组件；`PlayerControls` 统一网易云与本地音频控件；`PlayerSlot` 提供底部播放器挂载区域；`ThemeProvider` 与 `AppearanceSettings` 管理明暗及自定义主题色。包内使用 `#components/...`、`#hooks/...`、`#lib/...`，跨包使用 `@jp-learn/...`。完整开发规范见根目录 [AGENTS.md](../../AGENTS.md)。

从仓库根目录运行 `pnpm dev`。结构、内容格式、学习流程和验证命令见 [项目说明](../../README.md)。
