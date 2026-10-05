import { Button } from '#components/ui/button'
import { MusicLibraryPanel } from '#components/netease/MusicLibraryPanel'
import { LyricsPanel } from '#components/netease/LyricsPanel'
import { AccountDialog } from '#components/netease/AccountDialog'
import { PlayerControls } from '#components/PlayerControls'
import { PlayerPortal } from '#components/PlayerSlot'
import { useNeteasePractice } from '#hooks/use-netease-practice'
import { cn } from '#lib/utils'

export default function NeteasePractice({ visible }: { visible: boolean }) {
  const {
    slot,
    account,
    accountOpen,
    changeAccountOpen,
    mobileView,
    setMobileView,
    busy,
    query,
    setQuery,
    searched,
    songs,
    total,
    offset,
    selected,
    playing,
    playback,
    lines,
    lineIndex,
    showRomaji,
    showTranslation,
    setShowRomaji,
    setShowTranslation,
    loop,
    error,
    notice,
    search,
    selectSong,
    seekLine,
    lineRange,
    mediaProps,
    playerProps,
    favorites,
    favoritesError,
    toggleFavorite,
    selectFavorite,
  } = useNeteasePractice()
  const { ready, loggedIn, webLoggedIn, hybrid, qr, qrStatus } = account
  return (
    <>
      <section hidden={!visible} className="h-full min-h-0">
        <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          <div className="flex shrink-0 gap-1 border-b p-2 lg:hidden">
            {(['library', 'lyrics'] as const).map((view) => (
              <Button
                key={view}
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-1',
                  mobileView === view && 'bg-primary/10 text-primary',
                )}
                onClick={() => setMobileView(view)}
              >
                {view === 'library' ? '曲库' : '正在练习'}
              </Button>
            ))}
          </div>

          <MusicLibraryPanel
            className={mobileView !== 'library' ? 'max-lg:hidden' : undefined}
            ready={ready}
            loggedIn={loggedIn}
            webLoggedIn={webLoggedIn}
            busy={busy}
            query={query}
            searched={searched}
            songs={songs}
            favorites={favorites}
            favoritesError={favoritesError}
            error={error}
            onFavorite={toggleFavorite}
            onSelectFavorite={(song) => void selectFavorite(song)}
            selectedId={selected?.id}
            playing={playing}
            total={total}
            offset={offset}
            onQueryChange={setQuery}
            onSearch={(keyword, offset) => void search(keyword, offset)}
            onSelect={(song) => void selectSong(song)}
            onAccountOpen={() => changeAccountOpen(true)}
          />

          <LyricsPanel
            className={mobileView !== 'lyrics' ? 'max-lg:hidden' : undefined}
            visible={visible}
            playing={playing}
            favorite={Boolean(
              selected && favorites.some((song) => song.id === selected.id),
            )}
            onFavorite={() => {
              if (selected) toggleFavorite(selected)
            }}
            selected={selected}
            playback={playback}
            lines={lines}
            lineIndex={lineIndex}
            showRomaji={showRomaji}
            showTranslation={showTranslation}
            webLoggedIn={webLoggedIn}
            loop={loop}
            favoritesError={favoritesError}
            error={error}
            notice={notice}
            lineRange={lineRange}
            onRomajiChange={setShowRomaji}
            onTranslationChange={setShowTranslation}
            onSeekLine={seekLine}
            onRetry={() => {
              if (selected) void selectSong(selected)
            }}
          />
        </div>
      </section>

      <AccountDialog
        open={accountOpen}
        ready={ready}
        loggedIn={loggedIn}
        webLoggedIn={webLoggedIn}
        hybrid={hybrid}
        busy={busy}
        qr={qr}
        qrStatus={qrStatus}
        error={error}
        onOpenChange={changeAccountOpen}
        onLogin={(kind) => void account.login(kind)}
        onLogout={() => void account.logout()}
        onDisconnectWeb={() => void account.disconnectWeb()}
      />
      {selected && playback && <audio {...mediaProps} />}
      <PlayerPortal active={slot.active}>
        <PlayerControls {...playerProps} />
      </PlayerPortal>
    </>
  )
}
