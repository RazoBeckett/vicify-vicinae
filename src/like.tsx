import { showToast, Toast } from '@vicinae/api';
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
    const trackId = trackItem.id;
    await spotify.currentUser.tracks.saveTracks([trackId]);
    
    const trackName = trackItem.name;
    const artistNames = formatArtists(trackItem.artists);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Added to Liked Songs',
      message: `${trackName} - ${artistNames}`,
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to like track');
  }
}
