import { useAccount } from '#hooks/use-account'
import { favoriteMetadata } from '#lib/music-favorites'
import type { FavoriteSong } from '#lib/music-favorites'

export function useMusicFavorites() {
  const account = useAccount()
  return {
    favorites: account.data.favorites,
    favoritesError: account.error,
    toggleFavorite: (song: FavoriteSong) =>
      account.update({
        kind: 'favorite',
        song: favoriteMetadata(song),
        saved: !account.data.favorites.some((item) => item.id === song.id),
      }),
  }
}
