import { showToast, Toast, Clipboard } from '@vicinae/api';
import { handleSpotifyError, withCurrentTrack } from './utils/spotify';

const SPOTIFY_ID_REGEX = /^[A-Za-z0-9]{22}$/;

function sanitizeForHtml(value: string): string {
  const trimmed = value.trim();
  if (!SPOTIFY_ID_REGEX.test(trimmed)) {
    throw new Error('Invalid Spotify track ID format');
  }
  return trimmed;
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
    if (error instanceof Error && error.message === 'Invalid Spotify track ID format') {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Invalid Track',
        message: 'Could not generate embed code',
      });
      return;
    }
    await handleSpotifyError(error, 'Failed to copy embed code');
  }
}
