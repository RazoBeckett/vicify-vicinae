import { showToast, Toast, open } from '@vicinae/api';
import { handleSpotifyError, formatArtists, withCurrentTrack } from './utils/spotify';

export default async function Command(): Promise<void> {
  try {
    const track = await withCurrentTrack(async (t) => {
      const artistNames = formatArtists(t.artists);
      const searchQuery = encodeURIComponent(`${artistNames} ${t.name} lyrics`);
      const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
      await open(googleSearchUrl);
      return { name: t.name, artistNames };
    });
    
    if (!track) return;
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Searching for Lyrics',
      message: `${track.name} - ${track.artistNames}`,
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to search for lyrics');
  }
}
