import { showToast, Toast, Clipboard } from '@vicinae/api';
import { handleSpotifyError, formatArtists, withCurrentTrack } from './utils/spotify';

export default async function Command(): Promise<void> {
  try {
    const track = await withCurrentTrack(async (t) => {
      const text = `${formatArtists(t.artists)} - ${t.name}`;
      await Clipboard.copy(text);
      return text;
    });
    
    if (!track) return;
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Copied to Clipboard',
      message: track,
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to copy track info');
  }
}
