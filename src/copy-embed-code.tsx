import { showToast, Toast, Clipboard } from '@vicinae/api';
import { handleSpotifyError, withCurrentTrack } from './utils/spotify';

function sanitizeForHtml(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export default async function Command(): Promise<void> {
  try {
    await withCurrentTrack(async (track) => {
      const trackId = sanitizeForHtml(track.id);
      const embedCode = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/${trackId}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
      await Clipboard.copy(embedCode);
    });
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Copied Embed Code',
      message: 'Paste in your HTML',
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to copy embed code');
  }
}
