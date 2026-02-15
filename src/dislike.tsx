import { showToast, Toast } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, formatArtists, withCurrentTrack } from './utils/spotify';

export default async function Command(): Promise<void> {
  try {
    const spotify = await getSpotifyClient();
    
    const track = await withCurrentTrack(async (t) => {
      await spotify.currentUser.tracks.removeSavedTracks([t.id]);
      return t;
    });
    
    if (!track) return;
    
    await showToast({
      style: Toast.Style.Success,
      title: 'Removed from Liked Songs',
      message: `${track.name} - ${formatArtists(track.artists)}`,
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to remove track from liked songs');
  }
}
