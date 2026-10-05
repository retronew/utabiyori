# 歌日和开发约定

本文件适用于整个仓库。修改前先阅读相关代码、`README.md` 和功能文档，检查 Git 状态，保留已有未提交改动。以用户当前要求为准；未经要求，不推送或部署。

## 项目与包边界

- 使用 pnpm workspace；包管理器版本以根 `package.json` 的 `packageManager` 为准，Node.js 版本遵循 `engines`。不要混用 npm、Yarn 或 Bun 安装依赖。
- `apps/web`：React、TypeScript、Vite、Tailwind CSS 4、coss ui / Base UI。负责界面、浏览器媒体、课程与进度的本地存储。
- `apps/api`：网易云服务端签名、授权、加密会话、曲库与音频权限处理。对外入口为 `@jp-learn/api/handler`。
- 根 `api/netease.ts` 仅作为 Vercel Functions 入口。本地开发由 Vite 中间件调用同一个 API handler，不另写一套接口逻辑。
- `packages/content`：原创课程数据；`packages/shared`：跨包内容类型、校验及无平台依赖的纯函数。
- 只在确有跨包消费者时将代码移到共享包。浏览器逻辑不引入服务端实现；客户端只通过 `/api/netease` 访问音乐服务。

## 导入与命名

- 包内使用 `#xxx`，**`#` 后不加 `/`**：如 `#components/ui/button`、`#hooks/use-local-audio`、`#lib/media`、`#client`。不要新增 `@/xxx` 或绕过包入口的跨包相对路径。
- 跨包使用 `@jp-learn/*`，依赖声明采用 `workspace:*`；第三方依赖使用其正式包名。
- 内部映射放在各包 `package.json` 的 `imports`；公共入口放在 `exports`。调整映射时同步相关 TypeScript 配置。
- 使用 Node / Vite 原生包映射，不为所有 `#` 导入注册全局正则别名，以免覆盖依赖包自己的内部映射。
- API 的 `types` / `source` 条件指向 TypeScript 源码，默认入口指向构建产物。开发与测试使用现有 `source` 条件脚本，生产构建保持可独立加载的 API bundle。
- 自有 React 组件使用 PascalCase 文件名和命名导出；现有 `App`、`AudioPractice`、`NeteasePractice` 默认导出可保留。hook 文件使用 `use-xxx.ts`，工具文件使用 kebab-case。
- 类型使用 `import type`。优先具名类型、`unknown` 与必要的类型收窄，不新增 `any` 或通过断言掩盖不确定的外部数据。
- 导入按第三方 / workspace 包、包内模块分组；同一模块的类型与值相邻，不保留无用导入。

## 前端职责与拆分

- `App.tsx` 只组合应用布局、导航和工作区。不要重新把课程存储、TTS、扫码轮询或音频事件塞进入口组件。
- `components/layout` 放应用侧栏和页头；`components/lessons` 放课程列表、歌词、逐句练习与复习；`components/netease` 放曲库、歌词和账号弹窗；`components/local` 放本地音频专属界面。
- `components/ui` 是 coss ui 基础组件。业务请求、音乐版权判断和课程状态不放入基础组件；保留第三方许可声明。
- `hooks` 管理状态、副作用和资源生命周期；`lib` 放格式化、范围计算、存储解析、上下文与事件协议等工具。纯函数保持可独立测试。
- 网易云授权由 `useNeteaseAccount` 管理，播放记录由 `usePlaybackReport` 管理，曲库与播放协调由 `useNeteasePractice` 管理。本地音频由 `useLocalAudio` 管理；课程与 TTS 分别由 `useLessonPractice`、`useSpeechPractice` 管理。
- 优先按业务职责、独立交互和可复用边界拆分。长组件同时承担请求、副作用和多个界面区域时应拆分；不要仅为缩短行数制造单节点包装或多层透传。
- 展示组件接收明确的数据和 `onXxx` 回调，不拥有同一份业务状态的副本。只有工作区协调组件可以接收完整业务 hook 返回值；子面板仍使用具体 props。
- 同一媒体生命周期由一个 hook 负责。不要为本地文件和在线版权音频强行设计万能播放器状态机。
- 需要组合媒体或控件 props 时使用 `satisfies` 保持接口检查，避免无类型的 props 容器。不要无依据添加 `useMemo`、`useCallback` 或全局状态库。
- 非首屏课程、复习和外观设置可按需加载，提供可访问的加载提示；不要通过切页卸载音频工作区来缩小首屏包。

## 样式、主题与可访问性

- 优先 Tailwind class、`cn` 和 coss ui 组件。布局、断点、状态、间距不新增专用 CSS 文件；`index.css` 保留主题 token、必要的全局规则与减少动态效果规则。
- 常规界面使用 `bg-background`、`text-foreground`、`bg-card`、`text-primary` 等语义 token。固定颜色仅用于有意独立的视觉区域，例如封面背景上的歌词面板，并检查其文字对比度。
- 明暗与主题色统一通过 `ThemeProvider` / `useTheme` 修改，不在功能组件里单独写根节点 class 或主题变量。保留系统主题跟随、自定义颜色校验和存储失败提示。
- 动态颜色等无法预先枚举的值可使用 CSS 变量；不要拼接 Tailwind 无法静态扫描的 class，也不要写样式字符串代替现有 token。
- 按钮使用真实 button，图标按钮提供可访问名称，开关提供标签，错误使用 `role="alert"`、进度提示使用 `role="status"`。保留键盘操作、焦点样式、弹窗焦点管理和 `prefers-reduced-motion` 支持。
- 页面使用视口内布局和独立滚动区域。歌词跟随只滚动歌词 viewport，用户手动滚动后暂缓自动跟随，避免滚动整个页面。
- 验证桌面和手机布局；多行卡片使用按钮时注意基础组件的响应式固定高度，显式设置所需断点的 `h-auto`。

## 音频、异步与持久化

- 网易云和本地音频工作区保持挂载；切换导航只改变可见性，不能意外停止播放或释放当前音频。
- 音频互斥使用 `#lib/audio-events` 的 `announceAudio` 与 `useExclusiveAudio`。开始另一来源时同时取消 TTS，并同步其朗读状态。不要重复声明事件名称。
- 释放对象 URL、定时器、事件监听、`ResizeObserver` 和请求控制器。媒体暂停、等待、结束、失败都必须同步播放状态。
- 搜索、切歌和二维码生成需要取消旧请求，并防止旧响应覆盖新状态；关闭扫码弹窗停止轮询与生成，断开账号使正在加载的歌曲失效。
- Effect 用于同步外部系统，正常用户动作在事件回调处理。使用 `useEffectEvent` 时只从 effect 或其注册的回调调用，不当作普通事件处理器或逃避依赖检查。
- 不整体关闭 lint 规则。必要的局部例外说明具体原因，例如异步 fetch 状态更新被工具误判为同步 effect 更新。
- 音频 `play()` 失败必须有可见提示。播放地址过期后重新获取；逐句跳转、进度与循环都限制在实际试听范围内。
- 播放记录统计实际播放的媒体时长，处理暂停、缓冲、倍速与页面离开，不将 seek 跳转距离算作已播放时长。
- 存储读取按不可信数据处理，损坏或不可用时安全回退；写入失败提示用户。保持现有 localStorage key 和课程 ID 的兼容性，不因重构清空数据。
- 本地音频仅在浏览器播放，不上传或持久保存文件。时间显示统一使用 `#lib/media` 的 `formatTime`。

## API 与安全

- 网易云接入细节见 `docs/netease.md`。官方曲库 / 歌词与备用网页音频仍按现有权限边界工作，不绕过会员、购买、试听或版权限制。
- AppSecret、PrivateKey、会话加密密钥等仅存在服务端环境变量。不得放到 `VITE_*`、客户端源码、公开响应、日志、测试快照或 Git 中。
- 不打印 `.env.local`、会话 Cookie、用户 token、签名请求或完整供应商调试数据。`.env.example` 仅使用占位值。
- 保留加密 HttpOnly 会话、同源检查、输入校验、限流、歌曲票据和安全 URL 校验。Vercel Functions 不依赖进程内状态作为唯一授权依据。
- 外部错误转换为安全、可理解的消息；不要将供应商响应原样返回给客户端。

## 格式、注释与验证

- Prettier 是格式基准：无分号、单引号、尾逗号；前端使用现有 Oxlint 配置与 TypeScript 严格检查。不要额外引入冲突的格式器。
- 注释解释兼容性、安全边界、资源释放或不明显的约束，不复述代码。新增代码注释用简洁英文；用户界面和项目文档用中文。
- 为范围边界、歌词时间轴、存储解析、安全校验等关键行为添加有意义的测试；不要为纯包装组件或单纯样式拆分添加实现镜像测试。
- 从仓库根目录运行：

  ```sh
  pnpm typecheck
  pnpm lint
  pnpm test
  pnpm format:check
  pnpm build
  git diff --check
  ```

- 仅修改局部时可先跑对应包检查；跨包导入、构建或广泛重构完成后运行上述完整检查。运行命令失败时不能将其报告为验证通过。
- 播放相关重构补充真实浏览器回归：切页不中断播放、不同音频互斥、倍速与定位、逐句 / A–B 循环、非法范围、加载失败。授权变化检查关闭弹窗与过期请求；主题变化检查明暗、自定义颜色和刷新持久化。
- 区分静态检查、本地交互、模拟数据和真实服务验证。没有执行的登录、会员歌曲播放或线上部署不能声称通过。
- API 构建或 Vercel 入口调整需额外验证 `apps/api/dist/handler.js` 的独立加载，必要时运行 Vercel 本地构建。生产部署需要用户请求。
- 临时脚本和截图放在已忽略的 `.artifacts`，不要提交密钥、构建产物或调试文件。功能结构或接口变化同步更新相关 README / 文档。
