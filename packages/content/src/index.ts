import type { Song } from '@jp-learn/shared'

// Original learning material. No commercial song lyrics or recordings are bundled.
export const songs: Song[] = [
  {
    id: 'small-light',
    title: '小さな光',
    subtitle: 'ちいさなひかり · 小小的光',
    theme: 'sage',
    description: '从一小句开始，把熟悉的声音变成看得懂的日语。',
    lines: [
      {
        id: '1',
        tokens: [
          { text: '小', reading: 'ちい' },
          { text: 'さな' },
          { text: '光', reading: 'ひかり' },
        ],
        kana: 'ちいさなひかり',
        romaji: 'chiisana hikari',
        translation: '小小的光',
        tip: 'ちい里的两个 i 都要保留，读成 chi-i；唱歌时可以分开感受两个拍子。',
        focus: [
          { kana: 'ち', romaji: 'chi', example: 'ちいさな · 小小的' },
          { kana: 'ひ', romaji: 'hi', example: 'ひかり · 光' },
        ],
      },
      {
        id: '2',
        tokens: [
          { text: '夜', reading: 'よる' },
          { text: 'の' },
          { text: '空', reading: 'そら' },
          { text: 'に' },
        ],
        kana: 'よるのそらに',
        romaji: 'yoru no sora ni',
        translation: '在夜晚的天空中',
        tip: '先按 yo / ru / no / so / ra / ni 慢慢读，再把它们连起来。に在这里表示位置。',
        focus: [
          { kana: 'よ', romaji: 'yo', example: 'よる · 夜晚' },
          { kana: 'そ', romaji: 'so', example: 'そら · 天空' },
        ],
      },
      {
        id: '3',
        tokens: [
          { text: '君', reading: 'きみ' },
          { text: 'の' },
          { text: '声', reading: 'こえ' },
          { text: 'が' },
        ],
        kana: 'きみのこえが',
        romaji: 'kimi no koe ga',
        translation: '你的声音',
        tip: 'こえ是 ko-e，两个元音分别发出来。が标记后面动作的主语。',
        focus: [
          { kana: 'き', romaji: 'ki', example: 'きみ · 你' },
          { kana: 'こ', romaji: 'ko', example: 'こえ · 声音' },
        ],
      },
      {
        id: '4',
        tokens: [
          { text: '心', reading: 'こころ' },
          { text: 'に' },
          { text: '届', reading: 'とど' },
          { text: 'く' },
        ],
        kana: 'こころにとどく',
        romaji: 'kokoro ni todoku',
        translation: '传到心里',
        tip: 'とどく的意思是到达。日语的 r 是轻轻弹一下舌尖，不必卷舌。',
        focus: [
          { kana: 'ろ', romaji: 'ro', example: 'こころ · 心' },
          { kana: 'く', romaji: 'ku', example: 'とどく · 到达' },
        ],
      },
    ],
  },
  {
    id: 'spring-walk',
    title: '春の散歩',
    subtitle: 'はるのさんぽ · 春日散步',
    theme: 'peach',
    description: '跟着轻快的短句，认识长音和小小的促音。',
    lines: [
      {
        id: '1',
        tokens: [
          { text: '春', reading: 'はる' },
          { text: 'の' },
          { text: '風', reading: 'かぜ' },
        ],
        kana: 'はるのかぜ',
        romaji: 'haru no kaze',
        translation: '春天的风',
        tip: 'ぜ是せ加上浊点。先对比 se 和 ze，再读完整句。',
        focus: [
          { kana: 'は', romaji: 'ha', example: 'はる · 春天' },
          { kana: 'ぜ', romaji: 'ze', example: 'かぜ · 风' },
        ],
      },
      {
        id: '2',
        tokens: [
          { text: 'そっと' },
          { text: '歩', reading: 'ある' },
          { text: 'こう' },
        ],
        kana: 'そっとあるこう',
        romaji: 'sotto arukou',
        translation: '轻轻地走吧',
        tip: '小っ不读 tsu，在这里停一拍再读 to。こう中的 ou 表示拉长 o。',
        focus: [
          { kana: 'っ', romaji: '停一拍', example: 'そっと · 轻轻地' },
          { kana: 'こ', romaji: 'ko', example: 'あるこう · 走吧' },
        ],
      },
      {
        id: '3',
        tokens: [
          { text: '明日', reading: 'あした' },
          { text: 'も' },
          { text: '晴', reading: 'は' },
          { text: 'れる' },
        ],
        kana: 'あしたもはれる',
        romaji: 'ashita mo hareru',
        translation: '明天也会放晴',
        tip: 'し读 shi。した中的 i 在自然语速下可能很轻，先保持清晰再模仿。',
        focus: [
          { kana: 'し', romaji: 'shi', example: 'あした · 明天' },
          { kana: 'も', romaji: 'mo', example: 'も · 也' },
        ],
      },
    ],
  },
  {
    id: 'to-you',
    title: '君へ',
    subtitle: 'きみへ · 写给你',
    theme: 'lavender',
    description: '从能听懂的词出发，练习把一句话完整唱出来。',
    lines: [
      {
        id: '1',
        tokens: [{ text: '君', reading: 'きみ' }, { text: 'へ' }],
        kana: 'きみへ',
        romaji: 'kimi e',
        translation: '给你',
        tip: 'へ作为表示方向的助词时读 e。遇到它时，不要机械地按 he 来读。',
        focus: [
          { kana: 'へ', romaji: 'he / 助词 e', example: 'きみへ · 给你' },
          { kana: 'み', romaji: 'mi', example: 'きみ · 你' },
        ],
      },
      {
        id: '2',
        tokens: [{ text: 'ありがとう' }],
        kana: 'ありがとう',
        romaji: 'arigatou',
        translation: '谢谢你',
        tip: 'とう的 ou 是长音，给 o 多留一拍。唱歌时长音可以随旋律延长。',
        focus: [
          { kana: 'あ', romaji: 'a', example: 'ありがとう · 谢谢' },
          { kana: 'と', romaji: 'to', example: 'とう · 长音 tō' },
        ],
      },
      {
        id: '3',
        tokens: [
          { text: 'また' },
          { text: '会', reading: 'あ' },
          { text: 'おう' },
        ],
        kana: 'またあおう',
        romaji: 'mata aou',
        translation: '再见吧',
        tip: 'あおう的 a 和长音 o 分开发，不要把它读成一个音。',
        focus: [
          { kana: 'ま', romaji: 'ma', example: 'また · 再' },
          { kana: 'お', romaji: 'o', example: 'あおう · 见面吧' },
        ],
      },
    ],
  },
]
