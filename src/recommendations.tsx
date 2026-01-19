import { List, ActionPanel, Action, Icon, showToast, Toast, LaunchProps } from '@vicinae/api';
import { getSpotifyClient, handleSpotifyError, formatArtists, formatDuration } from './utils/spotify';
import { useState, useEffect } from 'react';

interface Arguments {
  seedTrack?: string;
}

export default function Recommendations(props: LaunchProps<{ arguments: Arguments }>) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendationType, setRecommendationType] = useState<'seed' | 'top'>('seed');
  const { seedTrack } = props.arguments || {};

  useEffect(() => {
    if (seedTrack) {
      setRecommendationType('seed');
      loadRecommendations(seedTrack);
    } else {
      loadRecommendations();
    }
  }, [seedTrack]);

  async function loadRecommendations(seed?: string) {
    try {
      setIsLoading(true);
      const spotify = await getSpotifyClient();
      
      let recommendations;
      if (seed) {
        recommendations = await spotify.recommendations.get({
            seed_tracks: [seed],
            limit: 50
          });
      } else {
        // Get top tracks to use as seed
        const topTracks = await spotify.currentUser.topItems('tracks', { limit: 5, time_range: 'short_term' });
        const trackIds = topTracks.items.map(t => t.id);
        
        if (trackIds.length > 0) {
          recommendations = await spotify.recommendations.get({
                seed_tracks: trackIds,
                limit: 50
              });
        } else {
          recommendations = { tracks: [] };
        }
      }
      
      setRecommendations(recommendations.tracks || []);
    } catch (error) {
      await handleSpotifyError(error, 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }

  async function playTrack(uri: string) {
    try {
      const spotify = await getSpotifyClient();
      await spotify.player.startResumePlayback(undefined as any, undefined, [uri]);
      await showToast({
        style: Toast.Style.Success,
        title: 'Playing Track',
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to play track');
    }
  }

  async function addToQueue(uri: string, name: string) {
    try {
      const spotify = await getSpotifyClient();
      await spotify.player.addItemToPlaybackQueue(uri);
      await showToast({
        style: Toast.Style.Success,
        title: 'Added to Queue',
        message: name,
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to add to queue');
    }
  }

  async function likeTrack(trackId: string, name: string) {
    try {
      const spotify = await getSpotifyClient();
      await spotify.currentUser.saveTracks([trackId]);
      await showToast({
        style: Toast.Style.Success,
        title: 'Liked',
        message: `Added ${name} to Liked Songs`,
      });
    } catch (error) {
      await handleSpotifyError(error, 'Failed to like track');
    }
  }

  function getTrackIcon(track: any): string {
    return track.album?.images?.[0]?.url || Icon.Music;
  }

  function getTrackSubtitle(track: any): string {
    return `${formatArtists(track.artists)} • ${formatDuration(track.duration_ms)}`;
  }

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Recommendation Type"
          onChange={(value) => {
            setRecommendationType(value as any);
            if (value === 'seed' && seedTrack) {
              loadRecommendations(seedTrack);
            } else {
              loadRecommendations();
            }
          }}
        >
          <List.Dropdown.Item title="Based on Listening History" value="top" />
          <List.Dropdown.Item title="Based on Current Track" value="seed" />
        </List.Dropdown>
      }
    >
      {recommendations.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.Music}
          title="No Recommendations"
          description="Listen to more music to get personalized recommendations"
        />
      )}

      {recommendations.map((track) => (
        <List.Item
          key={track.id}
          title={track.name}
          subtitle={getTrackSubtitle(track)}
          icon={getTrackIcon(track)}
          actions={
            <ActionPanel>
              <Action
                title="Play"
                icon={Icon.Play}
                onAction={() => playTrack(track.uri)}
              />
              <Action
                title="Add to Queue"
                icon={Icon.Plus}
                onAction={() => addToQueue(track.uri, track.name)}
                shortcut={{ modifiers: ['cmd'], key: 'q' }}
              />
              <Action
                title="Like"
                icon={Icon.Heart}
                onAction={() => likeTrack(track.id, track.name)}
                shortcut={{ modifiers: ['cmd'], key: 'l' }}
              />
              <Action.OpenInBrowser
                title="Open in Spotify"
                url={track.external_urls?.spotify || ''}
              />
              <Action.CopyToClipboard
                title="Copy Track URI"
                content={track.uri}
                shortcut={{ modifiers: ['cmd'], key: 'c' }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
