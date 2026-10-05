import type { MusicSong } from '#music'

export type FavoriteSong = Pick<
  MusicSong,
  'id' | 'name' | 'artists' | 'album' | 'duration' | 'cover'
>
export const favoritesKey = 'utabiyori:music-favorites:v1'
export const favoritesLimit = 500

export async function resolveFavorite(
  song: FavoriteSong,
  search: (
    keyword: string,
    offset: number,
    signal: AbortSignal,
  ) => Promise<{ songs: MusicSong[]; total: number }>,
  signal: AbortSignal,
): Promise<MusicSong> {
  const keywords = [
    ...new Set([
      `${song.name} ${song.artists.split(' / ')[0]}`.trim(),
      song.name,
    ]),
  ]
  for (const keyword of keywords) {
    for (let offset = 0; offset < 36; offset += 12) {
      signal.throwIfAborted()
      const result = await search(keyword, offset, signal)
      signal.throwIfAborted()
      const match = result.songs.find((item) => item.id === song.id)
      if (match) return match
      if (!result.songs.length || offset + result.songs.length >= result.total)
        break
    }
  }
  throw new Error('暂时无法在曲库中找到这首收藏，请重新搜索；收藏仍会保留。')
}

export function favoriteMetadata(song: FavoriteSong): FavoriteSong {
  return {
    id: song.id,
    name: song.name,
    artists: song.artists,
    album: song.album,
    duration: song.duration,
    cover: song.cover,
  }
}

export function parseFavorites(raw: string | null): FavoriteSong[] {
  if (!raw) return []
  const value: unknown = JSON.parse(raw)
  if (!Array.isArray(value)) throw new Error('Invalid favorites')
  const songs: FavoriteSong[] = []
  const ids = new Set<string>()
  for (const row of value.slice(0, favoritesLimit)) {
    if (!row || typeof row !== 'object') continue
    const song = row as Record<string, unknown>
    if (
      typeof song.id !== 'string' ||
      !/^[a-zA-Z0-9]{1,64}$/.test(song.id) ||
      typeof song.name !== 'string' ||
      !song.name.trim() ||
      song.name.length > 500 ||
      typeof song.artists !== 'string' ||
      song.artists.length > 500 ||
      typeof song.duration !== 'number' ||
      !Number.isFinite(song.duration) ||
      song.duration < 0 ||
      ids.has(song.id)
    )
      continue
    ids.add(song.id)
    songs.push(
      favoriteMetadata({
        id: song.id,
        name: song.name,
        artists: song.artists,
        duration: song.duration,
        album:
          typeof song.album === 'string' ? song.album.slice(0, 500) : undefined,
        cover:
          typeof song.cover === 'string' && /^https:\/\//.test(song.cover)
            ? song.cover.slice(0, 2000)
            : undefined,
      }),
    )
  }
  return songs
}
