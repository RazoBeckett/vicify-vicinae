import { showToast, Toast, Clipboard } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError } from './utils/spotify';
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
    const url = trackItem.external_urls?.spotify || '';
    
    if (!url) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'URL Not Available',
      });
      return;
    }
    
    await Clipboard.copy(url);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Copied URL to Clipboard',
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to copy URL');
  }
}
