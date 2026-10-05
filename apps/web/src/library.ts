import { songs as builtInSongs } from '@jp-learn/content'
import { isSong } from '@jp-learn/shared'
import type { Song } from '@jp-learn/shared'

const libraryKey = 'jp-learn:library:v1'
export function readLibrary(): Song[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(libraryKey) || '[]')
    if (!Array.isArray(value)) return []
    const ids = new Set(builtInSongs.map((song) => song.id))
    return value.filter((song): song is Song => {
      if (!isSong(song) || ids.has(song.id)) return false
      ids.add(song.id)
      return true
    })
  } catch {
    return []
  }
}
export async function importLesson(
  file: File,
  existing: Song[],
): Promise<Song[]> {
  if (file.size > 1024 * 1024)
    throw new Error('练习文件过大，请选择小于 1 MB 的文件。')
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('无法读取练习文件，请参考示例文件的格式。')
  }
  if (!isSong(data))
    throw new Error(
      '练习内容不完整，请检查逐句歌词、假名、释义和发音提示；句子编号不能重复。',
    )
  if (builtInSongs.some((song) => song.id === data.id))
    throw new Error('这份练习的编号与内置课程相同，请修改编号后导入。')
  if (existing.some((song) => song.id === data.id))
    throw new Error('这份练习已经导入，请为新的练习使用不同编号。')
  const next = [...existing, data]
  try {
    localStorage.setItem(libraryKey, JSON.stringify(next))
  } catch {
    throw new Error('浏览器无法保存课程，请释放站点存储空间后重试。')
  }
  return next
}
