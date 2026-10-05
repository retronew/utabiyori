import { Tabs, TabsList, TabsTab, TabsPanel } from '#components/ui/tabs'
import { MusicLibraryPanel } from '#components/netease/MusicLibraryPanel'
import { LyricsPanel } from '#components/netease/LyricsPanel'
import { AccountDialog } from '#components/netease/AccountDialog'
import { PlayerControls } from '#components/PlayerControls'
import { PlayerPortal } from '#components/PlayerSlot'
import { useNeteasePractice } from '#hooks/use-netease-practice'
import { useDesktopLayout } from '#hooks/use-desktop-layout'

export default function NeteasePractice({ visible }: { visible: boolean }) {
  const desktop = useDesktopLayout()
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
    readPlaybackTime,
    wordTiming,
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
          <div className="shrink-0 border-b p-2 lg:hidden">
            <TabsList aria-label="音乐工作区" className="w-full">
              {(['library', 'lyrics'] as const).map((view) => (
                <TabsTab key={view} value={view}>
                  {view === 'library' ? '曲库' : '正在练习'}
                </TabsTab>
              ))}
            </TabsList>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
            <TabsPanel
              value="library"
              keepMounted
              hidden={!desktop && mobileView !== 'library'}
              inert={!desktop && mobileView !== 'library'}
              className="min-h-0"
            >
              <MusicLibraryPanel
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
            </TabsPanel>

            <TabsPanel
              value="lyrics"
              keepMounted
              hidden={!desktop && mobileView !== 'lyrics'}
              inert={!desktop && mobileView !== 'lyrics'}
              className="min-h-0"
            >
              <LyricsPanel
                className="h-full"
                visible={visible && (desktop || mobileView === 'lyrics')}
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
