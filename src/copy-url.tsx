import { showToast, Toast, Clipboard } from '@vicinae/api';
import { handleSpotifyError, withCurrentTrack } from './utils/spotify';

export default async function Command(): Promise<void> {
  try {
    const url = await withCurrentTrack(async (track) => {
      const spotifyUrl = track.external_urls?.spotify;
      if (!spotifyUrl) {
        throw new Error('URL_NOT_AVAILABLE');
      }
      await Clipboard.copy(spotifyUrl);
      return spotifyUrl;
    });
    
    if (!url) return;
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Copied URL to Clipboard',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'URL_NOT_AVAILABLE') {
      await showToast({
        style: Toast.Style.Failure,
        title: 'URL Not Available',
      });
      return;
    }
    await handleSpotifyError(error, 'Failed to copy URL');
  }
}
