/**
 * Minimal Spotify types for Vicify extension
 * Contains only fields actually used in the codebase
 */

/**
 * External URLs object for Spotify entities
 */
export interface ExternalUrls {
  spotify?: string;
}

/**
 * Spotify Image object
 */
export interface Image {
  url: string;
}

/**
 * Spotify Artist
 */
export interface Artist {
  id: string;
  name: string;
  uri: string;
  images?: Image[];
  followers?: Followers;
  external_urls?: ExternalUrls;
}

/**
 * Followers count (for Artist)
 */
export interface Followers {
  total: number;
}

/**
 * Spotify Album
 */
export interface Album {
  id: string;
  name: string;
  uri: string;
  images: Image[];
  release_date?: string;
  total_tracks?: number;
  album_type?: string;
  external_urls?: ExternalUrls;
}

/**
 * Spotify Track
 */
export interface Track {
  id: string;
  name: string;
  uri: string;
  type: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  popularity?: number;
  explicit?: boolean;
  external_urls?: ExternalUrls;
}

/**
 * Playlist Owner
 */
export interface PlaylistOwner {
  display_name?: string;
}

/**
 * Playlist Tracks Summary
 */
export interface PlaylistTracks {
  total: number;
}

/**
 * Spotify Playlist
 */
export interface Playlist {
  id: string;
  name: string;
  uri: string;
  images: Image[];
  tracks: PlaylistTracks | null;
  external_urls?: ExternalUrls;
  public?: boolean;
  owner?: PlaylistOwner;
}

/**
 * Spotify Device
 */
export interface Device {
  id: string | null;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number | null;
}

/**
 * Playback State object from getCurrentlyPlayingTrack or getPlaybackState
 */
export interface PlaybackState {
  is_playing: boolean;
  progress_ms?: number;
  device?: Device;
  item?: Track;
  repeat_state: 'off' | 'track' | 'context';
  shuffle_state: boolean;
}

/**
 * Access Token shape (from Spotify OAuth)
 */
export interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  expires_at?: number;
}
