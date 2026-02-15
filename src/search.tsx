import { useState } from 'react';
import { List, ActionPanel, Action, Icon, showToast, Toast } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, formatArtists, requireActiveDevice, safeApiCall } from './utils/spotify';
import type { Track, Artist, Album, Playlist, PlaylistTracks, Followers } from './types/spotify';

type SearchResult = Track | Artist | Album | Playlist;
type SearchType = 'track' | 'artist' | 'album' | 'playlist';

const MAX_SEARCH_QUERY_LENGTH = 200;
const MIN_SEARCH_QUERY_LENGTH = 2;

/**
 * Sanitize search query by removing potentially dangerous characters
 * and limiting length
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .slice(0, MAX_SEARCH_QUERY_LENGTH)
    .replace(/[<>\"']/g, '');
}

export default function SearchSpotify() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('track');

  async function performSearch(query: string): Promise<void> {
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    if (!sanitizedQuery || sanitizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
      setSearchResults([]);
      setSearchText(sanitizedQuery);
      return;
    }

    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();
      
      const results = await spotify.search(sanitizedQuery, [searchType]);
      
      let items: SearchResult[] = [];
      switch (searchType) {
        case 'track':
          items = results.tracks?.items || [];
          break;
        case 'artist':
          items = results.artists?.items || [];
          break;
        case 'album':
          items = results.albums?.items || [];
          break;
        case 'playlist':
          items = results.playlists?.items || [];
          break;
      }
      
      setSearchResults(items);
    } catch (error) {
      await handleSpotifyError(error, 'Failed to search Spotify');
    } finally {
      setIsLoading(false);
    }
  }

  async function playTrack(uri: string) {
    try {
      const spotify = await getSpotifyClient();
      const playbackState = await requireActiveDevice(spotify);
      if (!playbackState) return;
      await safeApiCall(() => spotify.player.startResumePlayback(undefined as any, undefined, [uri]));
      await showToast({
        style: Toast.Style.Success,
        title: 'Playing Track',
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to play track');
    }
  }

  async function addToQueue(uri: string, name: string) {
    try {
      const spotify = await getSpotifyClient();
      const playbackState = await requireActiveDevice(spotify);
      if (!playbackState) return;
      await safeApiCall(() => spotify.player.addItemToPlaybackQueue(uri));
      await showToast({
        style: Toast.Style.Success,
        title: 'Added to Queue',
        message: name,
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to add to queue');
    }
  }

  function getItemTitle(item: SearchResult): string {
    return 'name' in item ? item.name : 'Unknown';
  }

  function getItemSubtitle(item: SearchResult): string {
    if (searchType === 'track' || searchType === 'album') {
      const hasArtists = 'artists' in item && Array.isArray(item.artists);
      return hasArtists ? formatArtists(item.artists as Artist[]) : '';
    }
    if (searchType === 'playlist') {
      const hasTracks = 'tracks' in item && item.tracks !== null;
      return hasTracks ? `${(item.tracks as PlaylistTracks).total} tracks` : '0 tracks';
    }
    if (searchType === 'artist') {
      const hasFollowers = 'followers' in item;
      return hasFollowers ? `${(item.followers as Followers).total} followers` : '';
    }
    return '';
  }

  function getItemIcon(item: SearchResult): string {
    if (searchType === 'artist') {
      const artist = item as unknown as { images?: { url: string }[] };
      return artist.images?.[0]?.url || Icon.Music;
    }
    const directImages = 'images' in item ? (item as Album | Playlist).images : undefined;
    const albumImages = 'album' in item && item.album && 'images' in item.album ? item.album.images : undefined;
    const images = directImages || albumImages || [];
    return images[0]?.url || Icon.Music;
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={performSearch}
      searchBarPlaceholder={`Search ${searchType}s...`}
      searchBarAccessory={
         <List.Dropdown
           tooltip="Search Type"
           onChange={(newValue) => {
             setSearchType(newValue as SearchType);
             performSearch(searchText);
           }}
        >
          <List.Dropdown.Item title="Tracks" value="track" />
          <List.Dropdown.Item title="Artists" value="artist" />
          <List.Dropdown.Item title="Albums" value="album" />
          <List.Dropdown.Item title="Playlists" value="playlist" />
        </List.Dropdown>
      }
    >
      {searchResults.length === 0 && !isLoading && searchText.length >= 2 && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Results Found"
          description={`No ${searchType}s found for "${searchText}"`}
        />
      )}
      
      {searchResults.length === 0 && searchText.length < 2 && (
        <List.EmptyView
          icon={Icon.Music}
          title="Search Spotify"
          description={`Search for ${searchType}s on Spotify`}
        />
      )}

      {searchResults.map((item) => {
        const itemKey = 'id' in item ? item.id : `artist-${item.name}`;
        const itemUri = 'uri' in item ? item.uri : '';
        return (
        <List.Item
          key={itemKey}
          title={getItemTitle(item)}
          subtitle={getItemSubtitle(item)}
          icon={getItemIcon(item)}
          actions={
            <ActionPanel>
              {(searchType === 'track' || searchType === 'album' || searchType === 'playlist') && (
                <>
                  <Action
                    title="Play"
                    icon={Icon.Play}
                    onAction={() => playTrack(itemUri)}
                  />
                  <Action
                    title="Add to Queue"
                    icon={Icon.Plus}
                    onAction={() => addToQueue(itemUri, item.name)}
                    shortcut={{ modifiers: ['cmd'], key: 'q' }}
                  />
                </>
              )}
              <Action.OpenInBrowser
                title="Open in Spotify"
                url={item.external_urls?.spotify || ''}
              />
              <Action.CopyToClipboard
                title="Copy Spotify URI"
                content={itemUri}
                shortcut={{ modifiers: ['cmd'], key: 'c' }}
              />
            </ActionPanel>
          }
        />
      )})}
    </List>
  );
}
