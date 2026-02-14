import { showToast, Toast } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, safeApiCall } from './utils/spotify';

/**
 * Set volume to a specific value (0-100).
 * Used by volume adjustment commands.
 */
export async function setVolumePreset(volume: number): Promise<void> {
  const clampedVolume = Math.max(0, Math.min(100, volume));

  try {
    const spotify = await getSpotifyClient();
    await safeApiCall(() => spotify.player.setPlaybackVolume(clampedVolume, undefined as any));

    await showToast({
      style: Toast.Style.Success,
      title: `Volume Set to ${clampedVolume}%`,
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to set volume');
  }
}
