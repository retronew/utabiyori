import { useRef } from 'react'
import { Tabs, TabsList, TabsTab, TabsPanel } from '#components/ui/tabs'
import { MusicLibraryPanel } from '#components/netease/MusicLibraryPanel'
import { LyricsPanel } from '#components/netease/LyricsPanel'
import { AccountDialog } from '#components/netease/AccountDialog'
import { PlayerControls } from '#components/PlayerControls'
import { PlayerPortal } from '#components/PlayerSlot'
import { useNeteasePractice } from '#hooks/use-netease-practice'
import { useDesktopLayout } from '#hooks/use-desktop-layout'
import { usePlayerContext } from '#hooks/use-player-slot'
import { cn } from '#lib/utils'

export default function NeteasePractice({ visible }: { visible: boolean }) {
  const accountTrigger = useRef<HTMLButtonElement>(null)
  const desktop = useDesktopLayout()
  const { fullscreen } = usePlayerContext()
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
    searchError,
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
    readPlaybackTime,
    wordTiming,
    lyricsLoading,
  } = useNeteasePractice()
  const { ready, loggedIn, webLoggedIn, hybrid, qr, qrStatus } = account
  return (
    <>
      <section hidden={!visible} className="h-full min-h-0">
        <Tabs
          value={mobileView}
          onValueChange={(value) => {
            if (value === 'library' || value === 'lyrics') setMobileView(value)
          }}
          className="h-full min-h-0 gap-0"
        >
          <div
            className={cn(
              'grid shrink-0 grid-rows-[1fr] px-3 transition-[grid-template-rows,opacity] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none lg:hidden',
              fullscreen.active &&
                'pointer-events-none grid-rows-[0fr] opacity-0',
            )}
            inert={fullscreen.active}
            aria-hidden={fullscreen.active || undefined}
          >
            <div className="min-h-0 overflow-clip">
              <TabsList aria-label="音乐工作区" className="mb-3 w-full">
                {(['library', 'lyrics'] as const).map((view) => (
                  <TabsTab key={view} value={view}>
                    {view === 'library' ? '曲库' : '正在练习'}
                  </TabsTab>
                ))}
              </TabsList>
            </div>
          </div>
          <div
            className={cn(
              'grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] px-3 transition-[grid-template-columns,padding] duration-(--fullscreen-duration) ease-(--ease-smooth-out) motion-reduce:transition-none lg:grid-cols-[280px_minmax(0,1fr)] lg:pr-4 lg:pl-0 xl:grid-cols-[300px_minmax(0,1fr)]',
              fullscreen.active && 'px-0! lg:grid-cols-[0px_minmax(0,1fr)]!',
            )}
          >
            <TabsPanel
              value="library"
              keepMounted
              hidden={
                !desktop && (fullscreen.active || mobileView !== 'library')
              }
              inert={
                fullscreen.active || (!desktop && mobileView !== 'library')
              }
              className={cn(
                'min-h-0 min-w-0 overflow-clip transition-opacity duration-(--duration-fast) motion-reduce:transition-none',
                fullscreen.active && 'pointer-events-none opacity-0',
              )}
            >
              <MusicLibraryPanel
                accountTrigger={accountTrigger}
                className="h-full"
                ready={ready}
                loggedIn={loggedIn}
                webLoggedIn={webLoggedIn}
                busy={busy}
                query={query}
                searched={searched}
                songs={songs}
                favorites={favorites}
                favoritesError={favoritesError}
                error={searchError || error}
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
            </TabsPanel>

            <TabsPanel
              value="lyrics"
              keepMounted
              hidden={!fullscreen.active && !desktop && mobileView !== 'lyrics'}
              inert={!fullscreen.active && !desktop && mobileView !== 'lyrics'}
              className="min-h-0"
            >
              <LyricsPanel
                loading={lyricsLoading}
                className={cn('h-full', fullscreen.active && 'rounded-none')}
                visible={
                  visible &&
                  (fullscreen.active || desktop || mobileView === 'lyrics')
                }
                playing={playing}
                current={playerProps.current}
                readTime={readPlaybackTime}
                wordTiming={wordTiming}
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
            </TabsPanel>
          </div>
        </Tabs>
      </section>

      <AccountDialog
        qrBusy={account.qrBusy}
        returnFocus={accountTrigger}
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
        <PlayerControls
          {...playerProps}
          emptyCover="/brand/netease-cloud-music.svg"
        />
      </PlayerPortal>
    </>
  )
}
