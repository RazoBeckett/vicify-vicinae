import { useState, useEffect } from 'react';
import { List, Grid, ActionPanel, Action, Icon, showToast, Toast, Keyboard } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, safeApiCall } from './utils/spotify';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
  duration_ms: number;
}

interface PlaylistTrack {
  track: Track;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function PlaylistDetail({ playlist, onBack }: { playlist: any; onBack: () => void }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTracks();
  }, [playlist.id]);

  async function loadTracks() {
    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();
      const result = await spotify.playlists.getPlaylistItems(playlist.id);
      setTracks(result.items.map((item: PlaylistTrack) => item.track));
    } catch (error) {
      await handleSpotifyError(error, 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  }

  async function playTrack(uri: string, trackName: string, trackIndex: number) {
    try {
      const spotify = await getSpotifyClient();
      // Play the track from the playlist context with offset
      await safeApiCall(() => spotify.player.startResumePlayback(
        undefined as any, 
        playlist.uri, 
        undefined,
        { position: trackIndex }
      ));
      await showToast({
        style: Toast.Style.Success,
        title: 'Playing Track',
        message: trackName,
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to play track');
    }
  }

  async function playPlaylist() {
    try {
      const spotify = await getSpotifyClient();
      await safeApiCall(() => spotify.player.startResumePlayback(undefined as any, playlist.uri));
      await showToast({
        style: Toast.Style.Success,
        title: 'Playing Playlist',
        message: playlist.name,
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to play playlist');
    }
  }

  async function addToQueue(uri: string, trackName: string) {
    try {
      const spotify = await getSpotifyClient();
      await safeApiCall(() => spotify.player.addItemToPlaybackQueue(uri));
      await showToast({
        style: Toast.Style.Success,
        title: 'Added to Queue',
        message: trackName,
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to add to queue');
    }
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search tracks..." navigationTitle={playlist.name}>
      <List.Section title={`${playlist.name} - ${tracks.length} tracks`}>
        {tracks.map((track, index) => (
          <List.Item
            key={track.id}
            title={track.name}
            subtitle={track.artists.map((a) => a.name).join(', ')}
            icon={track.album?.images?.[0]?.url || Icon.Music}
            accessories={[
              { text: formatDuration(track.duration_ms) },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Play Track"
                  icon={Icon.Play}
                  onAction={() => playTrack(track.uri, track.name, index)}
                />
                <Action
                  title="Add to Queue"
                  icon={Icon.Plus}
                  onAction={() => addToQueue(track.uri, track.name)}
                  shortcut={{ modifiers: ['cmd'], key: 'q' }}
                />
                <Action
                  title="Play Entire Playlist"
                  icon={Icon.AppWindowList}
                  onAction={playPlaylist}
                  shortcut={{ modifiers: ['cmd'], key: 'p' }}
                />
                <Action
                  title="Back to Playlists"
                  icon={Icon.ArrowLeft}
                  onAction={onBack}
                  shortcut={{ key: 'backspace', modifiers: [] }}
                />
                <Action.CopyToClipboard
                  title="Copy Track URI"
                  content={track.uri}
                  shortcut={{ modifiers: ['cmd'], key: 'c' }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

const STORAGE_KEY = 'vicify-library-view-mode';

function getViewMode(): 'list' | 'grid' {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'grid' || stored === 'list') ? stored : 'grid';
  } catch {
    return 'grid';
  }
}

function setViewMode(mode: 'list' | 'grid') {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }
}

export default function MyPlaylists() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewModeState] = useState<'list' | 'grid'>(() => getViewMode());

  useEffect(() => {
    loadPlaylists();
  }, []);

  async function loadPlaylists() {
    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();
      const result = await spotify.currentUser.playlists.playlists(50);
      setPlaylists(result.items);
    } catch (error) {
      await handleSpotifyError(error, 'Failed to load playlists');
    } finally {
      setIsLoading(false);
    }
  }

  async function playPlaylist(uri: string, name: string) {
    try {
      const spotify = await getSpotifyClient();
      await safeApiCall(() => spotify.player.startResumePlayback(undefined as any, uri));
      await showToast({
        style: Toast.Style.Success,
        title: 'Playing Playlist',
        message: name,
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to play playlist');
    }
  }

  function toggleViewMode() {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewModeState(newMode);
    setViewMode(newMode);
  }

  async function createNewPlaylist() {
    try {
      const spotify = await getSpotifyClient();
      const user = await spotify.currentUser.profile();
      const newPlaylist = await spotify.playlists.createPlaylist(user.id, {
        name: `New Playlist ${new Date().toLocaleDateString()}`,
        description: 'Created from Vicinae',
        public: false,
      });
      
      await showToast({
        style: Toast.Style.Success,
        title: 'Playlist Created',
        message: newPlaylist.name,
      });
      
      await loadPlaylists();
    } catch (error) {
      await handleSpotifyError(error, 'Failed to create playlist');
    }
  }

  function handlePlaylistSelect(playlist: any) {
    setSearchText('');
    setSelectedPlaylist(playlist);
  }

  if (selectedPlaylist) {
    return <PlaylistDetail playlist={selectedPlaylist} onBack={() => setSelectedPlaylist(null)} />;
  }

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const viewToggleAccessory = (
    <ActionPanel>
      <Action
        title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} View`}
        icon={viewMode === 'list' ? Icon.AppWindowGrid2x2 : Icon.AppWindowList}
        shortcut={{ modifiers: ['cmd'], key: 'g' }}
        onAction={toggleViewMode}
      />
    </ActionPanel>
  );

  if (viewMode === 'grid') {
    return (
      <Grid
        isLoading={isLoading}
        searchBarPlaceholder="Search playlists..."
        searchText={searchText}
        onSearchTextChange={setSearchText}
        searchBarAccessory={viewToggleAccessory}
        columns={4}
        fit={Grid.Fit.Fill}
      >
        <Grid.Section title="My Playlists">
          {filteredPlaylists.map((playlist) => (
            <Grid.Item
              key={playlist.id}
              title={playlist.name}
              subtitle={`${playlist.tracks?.total || 0} tracks`}
              content={playlist.images?.[0]?.url || { source: Icon.Music, tintColor: '#1DB954' }}
              actions={
                <ActionPanel>
                  <Action
                    title="View Playlist"
                    icon={Icon.Eye}
                    onAction={() => handlePlaylistSelect(playlist)}
                  />
                  <Action
                    title="Play Playlist"
                    icon={Icon.Play}
                    onAction={() => playPlaylist(playlist.uri, playlist.name)}
                    shortcut={{ modifiers: ['cmd'], key: 'p' }}
                  />
                  <Action.OpenInBrowser
                    title="Open in Spotify"
                    url={playlist.external_urls?.spotify || ''}
                  />
                  <Action.CopyToClipboard
                    title="Copy Playlist URI"
                    content={playlist.uri}
                    shortcut={{ modifiers: ['cmd'], key: 'c' }}
                  />
                  <Action
                    title="Switch to List View"
                    icon={Icon.AppWindowList}
                    shortcut={{ modifiers: ['cmd'], key: 'g' }}
                    onAction={toggleViewMode}
                  />
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    onAction={loadPlaylists}
                    shortcut={{ modifiers: ['cmd'], key: 'r' }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </Grid.Section>
      </Grid>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search playlists..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarAccessory={viewToggleAccessory}
    >
      <List.Section title="My Playlists">
        {filteredPlaylists.map((playlist) => (
          <List.Item
            key={playlist.id}
            title={playlist.name}
            subtitle={`${playlist.tracks?.total || 0} tracks`}
            icon={playlist.images?.[0]?.url || Icon.Music}
            accessories={[
              { text: playlist.public ? 'Public' : 'Private' },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="View Playlist"
                  icon={Icon.Eye}
                  onAction={() => handlePlaylistSelect(playlist)}
                />
                <Action
                  title="Play Playlist"
                  icon={Icon.Play}
                  onAction={() => playPlaylist(playlist.uri, playlist.name)}
                  shortcut={{ modifiers: ['cmd'], key: 'p' }}
                />
                <Action.OpenInBrowser
                  title="Open in Spotify"
                  url={playlist.external_urls?.spotify || ''}
                />
                <Action.CopyToClipboard
                  title="Copy Playlist URI"
                  content={playlist.uri}
                  shortcut={{ modifiers: ['cmd'], key: 'c' }}
                />
                <Action
                  title="Switch to Grid View"
                  icon={Icon.AppWindowGrid2x2}
                  shortcut={{ modifiers: ['cmd'], key: 'g' }}
                  onAction={toggleViewMode}
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={loadPlaylists}
                  shortcut={{ modifiers: ['cmd'], key: 'r' }}
                />
              </ActionPanel>
            }
          />
        ))}
        
        <List.Item
          icon={Icon.Plus}
          title="Create New Playlist"
          subtitle="Create a new empty playlist"
          actions={
            <ActionPanel>
              <Action
                title="Create Playlist"
                icon={Icon.Plus}
                onAction={createNewPlaylist}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
