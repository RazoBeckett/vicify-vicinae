import { showToast, Toast, open } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, formatArtists } from './utils/spotify';
import type { Track } from './types/spotify';

export default async function Command(): Promise<void> {
  try {
    const spotify = await getSpotifyClient();
    const currentTrack = await spotify.player.getCurrentlyPlayingTrack();
    
    if (!currentTrack || !currentTrack.item) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'No Track Playing',
        message: 'Please start playing a track first',
      });
      return;
    }
    
    const trackItem = currentTrack.item as Track;
    const trackName = trackItem.name;
    const artistNames = formatArtists(trackItem.artists);
    const searchQuery = encodeURIComponent(`${artistNames} ${trackName} lyrics`);
    const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
    
    await open(googleSearchUrl);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Searching for Lyrics',
      message: `${trackName} - ${artistNames}`,
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to search for lyrics');
  }
}
