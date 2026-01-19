import { List, ActionPanel, Action, Icon, showToast, Toast, Clipboard } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, formatArtists } from './utils/spotify';
import { useState, useEffect } from 'react';

interface SharePlatform {
  name: string;
  icon: string;
  url: string;
}

export default function ShareTrack() {
  const [track, setTrack] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trackUrl, setTrackUrl] = useState('');

  useEffect(() => {
    loadCurrentTrack();
  }, []);

  async function loadCurrentTrack() {
    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();
      const playback = await spotify.player.getCurrentlyPlayingTrack();
      
      if (playback && playback.item) {
        setTrack(playback.item);
        setTrackUrl(playback.item.external_urls?.spotify || '');
      } else {
        setTrack(null);
      }
    } catch (error) {
      await handleSpotifyError(error, 'Failed to load current track');
    } finally {
      setIsLoading(false);
    }
  }

  function getSharePlatforms(trackUrl: string, trackName: string): SharePlatform[] {
    const encodedUrl = encodeURIComponent(trackUrl);
    const encodedText = encodeURIComponent(`Listening to ${trackName} on Spotify`);
    
    return [
      {
        name: 'Twitter',
        icon: 'https://abs.twimg.com/favicons/twitter.ico',
        url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
      },
      {
        name: 'Facebook',
        icon: 'https://static.xx.fbcdn.net/rsrc.php/yD/r/d4ZSD7QzZ8I.ico',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      },
      {
        name: 'WhatsApp',
        icon: 'https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png',
        url: `https://wa.me/?text=${encodedText} ${encodedUrl}`
      },
      {
        name: 'LinkedIn',
        icon: 'https://static.licdn.com/aero/v1/0/favicon.ico',
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      },
      {
        name: 'Telegram',
        icon: 'https://telegram.org/favicon.ico',
        url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
      },
      {
        name: 'Reddit',
        icon: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png',
        url: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(trackName)}`
      }
    ];
  }

  async function copyTrackLink() {
    try {
      await Clipboard.copy({ text: trackUrl });
      await showToast({
        style: Toast.Style.Success,
        title: 'Link Copied',
        message: 'Track URL copied to clipboard'
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: 'Copy Failed',
        message: 'Failed to copy link to clipboard'
      });
    }
  }

  function openShareUrl(url: string) {
    return window.open(url, '_blank');
  }

  if (isLoading) {
    return <List isLoading />;
  }

  if (!track) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Music}
          title="No Track Playing"
          description="Start playing something on Spotify to share it"
          actions={
            <ActionPanel>
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                onAction={loadCurrentTrack}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const trackName = `${track.name} - ${formatArtists(track.artists)}`;
  const platforms = getSharePlatforms(trackUrl, trackName);

  return (
    <List searchBarPlaceholder="Share platforms...">
      <List.Item
        icon={Icon.Link}
        title="Copy Link"
        subtitle={trackUrl}
        actions={
          <ActionPanel>
            <Action
              title="Copy to Clipboard"
              icon={Icon.Clipboard}
              onAction={copyTrackLink}
              shortcut={{ modifiers: ['cmd'], key: 'c' }}
            />
          </ActionPanel>
        }
      />

      {platforms.map((platform) => (
        <List.Item
          key={platform.name}
          title={platform.name}
          icon={platform.url}
          actions={
            <ActionPanel>
              <Action
                title={`Share on ${platform.name}`}
                icon={Icon.Share}
                onAction={() => openShareUrl(platform.url)}
              />
            </ActionPanel>
          }
        />
      ))}

      <List.Item
        icon={Icon.ArrowClockwise}
        title="Refresh Track"
        actions={
          <ActionPanel>
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              onAction={loadCurrentTrack}
            />
          </ActionPanel>
        }
      />
    </List>
  );
}
