import { showToast, Toast, Clipboard } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError } from './utils/spotify';

/**
 * Sanitize a string for safe use in HTML attributes
 * Removes any characters that could be used for HTML injection
 */
function sanitizeForHtml(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export default async function Command() {
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
    
    const trackId = sanitizeForHtml(currentTrack.item.id);
    const embedCode = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${trackId}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    
    await Clipboard.copy(embedCode);
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Copied Embed Code',
      message: 'Paste in your HTML',
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to copy embed code');
  }
}
