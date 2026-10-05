# AMLL 歌词与背景

使用固定版本 `@applemusic-like-lyrics/core` / `@applemusic-like-lyrics/react` 0.6.0，按需加载歌词渲染器与 MeshGradient 流体背景。界面上的「AMLL · 源码」提供项目源码入口，第三方许可证保存在 `apps/web/public/licenses/AMLL-AGPL-3.0.txt`。

## 能力边界

| 模块             | 提供的能力                                               | 本项目采用方式                                 |
| ---------------- | -------------------------------------------------------- | ---------------------------------------------- |
| core / react     | 歌词逐词遮罩、发光、弹簧滚动、间奏、翻译与音译、流体背景 | 通过 `AmllLyrics` / `AmllBackground` 接入      |
| react-full       | 播放器界面、进度控件及播放、定位、音量等回调             | 不引入；保留 coss ui 播放控件                  |
| 完整 AMLL Player | 独立播放器应用                                           | 不是可直接替换浏览器 AudioTransport 的音频引擎 |
| FFT              | 音频频谱分析                                             | 未引入；背景不声称随节拍律动                   |

AMLL 核心组件不播放或解码音频。`react-full` 的 `onPlayOrResumeAtom`、`onSeekPositionAtom`、`onChangeVolumeAtom` 等将控制操作交给宿主实现，不能代替网易云鉴权、音频来源、试听范围或保音高变速。媒体仍由 `useAudioPlayback`、`AudioTransport`、Signalsmith Stretch 管理，不重复创建音频元素或 AudioContext。

参考：[组件快速入门](https://amll.dev/en/guides/component/quickstart.html)、[react-full 回调源码](https://github.com/amll-dev/applemusic-like-lyrics/blob/main/packages/react-full/src/states/callbacks.ts)、[react-full README](https://github.com/amll-dev/applemusic-like-lyrics/blob/main/packages/react-full/README.md)。

## 歌词转换与同步

`#lib/amll-lyrics` 将 `TimedLine[]` 转换为 AMLL 的 `LyricLine[]`，时间从原曲秒转换为整数毫秒。网易云官方逐字数据保留字词区间、间隙与行结束时间；只有 LRC 时一行作为一个 word，界面标注「句级跟随」，不构造假的字词时间。空白行不渲染，但仍作为上一句结束边界。转换同时保留源索引，点击渲染后的行仍使用原 `seekLine` 校验实际可播放范围。

翻译和罗马音分别通过 `translatedLyric`、`romanLyric` 提供。数组按数据及显示选项缓存，避免播放器每次进度变化重新构建并冻结歌词。禁用 AMLL 默认提前最多 600ms 的优化，以及行时间戳重写，保持学习界面与官方原曲时间轴一致。

逐帧读取 `AudioTransport.currentTime`，不能依赖 DSP 模式下隐藏音频元素的时钟。暂停、定位、循环和倍速都使用同一原曲时钟。歌词视口由 AMLL 单独滚动，手动滚动后由其滚动引擎暂缓自动跟随；点击歌词后重置跟随。

## 操作与降级

AMLL 0.6.0 动态歌词为指针点击的 DOM 展示。本项目通过 coss Dialog 的「歌词列表」提供完整文字阅读及 Tab / Enter 定位；弹窗关闭后恢复触发器焦点，播放快捷键不会抢占弹窗与控件。动效不可用时显示同一歌词列表，音频不被卸载。

歌词渲染器在工作区隐藏后停止逐帧更新。背景只在播放且区域可见时运行；暂停保留画面。系统减少动态效果时，背景使用静态模式，歌词关闭弹簧、缩放及模糊。封面静态图层作为加载与 WebGL 不可用时的背景。

## 本地验证范围

真实网易云歌曲验证使用 LONGMAN 的《spiral》：原生播放、0.75× 变速、歌词定位、逐句循环、输入框空格、切页不中断，以及与本地音频互斥。本地 WAV 验证 A–B 回绕及非法范围禁用。标准 / 极高分别返回 MP3 128 / 320 kbps，无损返回 FLAC；该歌曲的 Hi-Res 请求实际降级为无损，界面显示供应商结果。已检查桌面、390px 手机布局和系统明暗切换。

逐字权限仍不可用；逐字间隙与渲染使用模拟歌词验证，音质请求失败后的旧音频保留使用模拟错误验证。DSP 引擎沿用现有实现并通过自动化测试，本轮浏览器验收使用原生播放，不能据此声称 DSP 已完成真实浏览器验收。没有执行线上部署或读屏软件验收。

## 许可与发布

AMLL 包使用 **AGPL-3.0-only**。保留上游许可证和声明。当前接入没有自动替整个仓库选择许可证；后续公开发布或部署包含 AMLL 的构建前，需要确认项目授权及对应源码提供方式，不能把上游声明视为整个项目已获得 MIT 授权。不要向公开源码提交网易云凭据或用户会话。
