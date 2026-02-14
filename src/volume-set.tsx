import { showToast, Toast, LaunchProps } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, safeApiCall } from './utils/spotify';

interface Arguments {
  volume: string;
}

export default async function Command(props: LaunchProps<{ arguments: Arguments }>): Promise<void> {
  const volumeInput = props.arguments.volume;
  const volume = parseInt(volumeInput, 10);

  if (isNaN(volume) || !Number.isFinite(volume)) {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Invalid Input',
      message: `"${volumeInput}" is not a valid number`,
    });
    return;
  }

  if (volume < 0 || volume > 100) {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Invalid Volume',
      message: 'Volume must be between 0 and 100',
    });
    return;
  }

  try {
    const spotify = await getSpotifyClient();
    await safeApiCall(() => spotify.player.setPlaybackVolume(volume, undefined));

    await showToast({
      style: Toast.Style.Success,
      title: `Volume Set to ${volume}%`,
    });
  } catch (error) {
    await handleSpotifyError(error, 'Failed to set volume');
  }
}
