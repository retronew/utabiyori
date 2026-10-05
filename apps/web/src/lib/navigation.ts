import { Music2, BookOpen, RotateCcw, FileMusic } from 'lucide-react'

export type AppTab = 'songs' | 'review' | 'music' | 'local'

export function navigationItems(songCount?: number, learned?: number) {
  return [
    { id: 'music' as const, label: '网易云练习', icon: Music2 },
    {
      id: 'songs' as const,
      label: '歌曲练习',
      icon: BookOpen,
      count: songCount,
    },
    {
      id: 'review' as const,
      label: '我的复习',
      icon: RotateCcw,
      count: learned,
    },
    { id: 'local' as const, label: '本地音频', icon: FileMusic },
  ]
}
