import { useEffect, useState } from 'react'
import {
  favoriteMetadata,
  favoritesKey,
  favoritesLimit,
  parseFavorites,
} from '#lib/music-favorites'
import type { FavoriteSong } from '#lib/music-favorites'

export function useMusicFavorites() {
  const [state, setState] = useState(() => {
    try {
      return {
        songs: parseFavorites(localStorage.getItem(favoritesKey)),
        error: '',
      }
    } catch {
      return {
        songs: [] as FavoriteSong[],
        error: '收藏暂时无法读取，原有数据未覆盖。',
      }
    }
  })
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== favoritesKey) return
      try {
        setState({ songs: parseFavorites(event.newValue), error: '' })
      } catch {
        setState((previous) => ({
          ...previous,
          error: '另一页面的收藏无法读取。',
        }))
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  function toggle(song: FavoriteSong) {
    // Read before writing so another tab's latest favorites are preserved.
    try {
      const existing = parseFavorites(localStorage.getItem(favoritesKey))
      const saved = existing.some((item) => item.id === song.id)
      if (!saved && existing.length >= favoritesLimit) {
        setState((previous) => ({
          ...previous,
          error: '收藏已达 500 首，请先移除一些歌曲。',
        }))
        return
      }
      const songs = saved
        ? existing.filter((item) => item.id !== song.id)
        : [favoriteMetadata(song), ...existing]
      localStorage.setItem(favoritesKey, JSON.stringify(songs))
      setState({ songs, error: '' })
    } catch {
      setState((previous) => ({
        ...previous,
        error: '收藏未保存，请检查浏览器存储权限或空间。',
      }))
    }
  }
  return {
    favorites: state.songs,
    favoritesError: state.error,
    toggleFavorite: toggle,
  }
}
