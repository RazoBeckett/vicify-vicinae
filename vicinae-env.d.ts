/// <reference types="@vicinae/api">

/*
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 */

type ExtensionPreferences = {
  /** Spotify Client ID - Your Spotify app's Client ID (create at developer.spotify.com) */
	"clientId"?: string;
}

declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Command: Search */
	export type Search = ExtensionPreferences & {
		
	}

	/** Command: Next */
	export type Next = ExtensionPreferences & {
		
	}

	/** Command: Previous */
	export type Previous = ExtensionPreferences & {
		
	}

	/** Command: Toggle Play/Pause */
	export type TogglePlayPause = ExtensionPreferences & {
		
	}

	/** Command: Copy Artist And Title */
	export type CopyArtistAndTitle = ExtensionPreferences & {
		
	}

	/** Command: Find Lyrics */
	export type FindLyrics = ExtensionPreferences & {
		
	}

	/** Command: Your Library */
	export type YourLibrary = ExtensionPreferences & {
		
	}

	/** Command: Now Playing */
	export type NowPlaying = ExtensionPreferences & {
		
	}

	/** Command: Add Playing to Playlist */
	export type AddToPlaylist = ExtensionPreferences & {
		
	}

	/** Command: Remove Playing Song from Playlist */
	export type RemoveFromPlaylist = ExtensionPreferences & {
		
	}

	/** Command: Cycle Repeat */
	export type CycleRepeat = ExtensionPreferences & {
		
	}

	/** Command: Copy URL */
	export type CopyUrl = ExtensionPreferences & {
		
	}

	/** Command: Current Track */
	export type CurrentTrack = ExtensionPreferences & {
		
	}

	/** Command: Start Radio */
	export type StartRadio = ExtensionPreferences & {
		
	}

	/** Command: Like */
	export type Like = ExtensionPreferences & {
		
	}

	/** Command: Dislike */
	export type Dislike = ExtensionPreferences & {
		
	}

	/** Command: Just Play */
	export type JustPlay = ExtensionPreferences & {
		
	}

	/** Command: Queue */
	export type Queue = ExtensionPreferences & {
		
	}

	/** Command: Start DJ */
	export type StartDj = ExtensionPreferences & {
		
	}

	/** Command: Copy Embed Code */
	export type CopyEmbedCode = ExtensionPreferences & {
		
	}

	/** Command: Skip 15 Seconds */
	export type Skip15 = ExtensionPreferences & {
		
	}

	/** Command: Back 15 Seconds */
	export type Back15 = ExtensionPreferences & {
		
	}

	/** Command: Set Volume to */
	export type VolumeSet = ExtensionPreferences & {
		
	}

	/** Command: Turn Volume Down */
	export type VolumeDown = ExtensionPreferences & {
		
	}

	/** Command: Turn Volume Up */
	export type VolumeUp = ExtensionPreferences & {
		
	}

	/** Command: Toggle Shuffle */
	export type ToggleShuffle = ExtensionPreferences & {
		
	}

	/** Command: Devices */
	export type Devices = ExtensionPreferences & {
		
	}
}

declare namespace Arguments {
  /** Command: Search */
	export type Search = {
		
	}

	/** Command: Next */
	export type Next = {
		
	}

	/** Command: Previous */
	export type Previous = {
		
	}

	/** Command: Toggle Play/Pause */
	export type TogglePlayPause = {
		
	}

	/** Command: Copy Artist And Title */
	export type CopyArtistAndTitle = {
		
	}

	/** Command: Find Lyrics */
	export type FindLyrics = {
		
	}

	/** Command: Your Library */
	export type YourLibrary = {
		
	}

	/** Command: Now Playing */
	export type NowPlaying = {
		
	}

	/** Command: Add Playing to Playlist */
	export type AddToPlaylist = {
		
	}

	/** Command: Remove Playing Song from Playlist */
	export type RemoveFromPlaylist = {
		
	}

	/** Command: Cycle Repeat */
	export type CycleRepeat = {
		
	}

	/** Command: Copy URL */
	export type CopyUrl = {
		
	}

	/** Command: Current Track */
	export type CurrentTrack = {
		
	}

	/** Command: Start Radio */
	export type StartRadio = {
		
	}

	/** Command: Like */
	export type Like = {
		
	}

	/** Command: Dislike */
	export type Dislike = {
		
	}

	/** Command: Just Play */
	export type JustPlay = {
		
	}

	/** Command: Queue */
	export type Queue = {
		
	}

	/** Command: Start DJ */
	export type StartDj = {
		
	}

	/** Command: Copy Embed Code */
	export type CopyEmbedCode = {
		
	}

	/** Command: Skip 15 Seconds */
	export type Skip15 = {
		
	}

	/** Command: Back 15 Seconds */
	export type Back15 = {
		
	}

	/** Command: Set Volume to */
	export type VolumeSet = {
		/** 0-100 */
		"volume"?: string
	}

	/** Command: Turn Volume Down */
	export type VolumeDown = {
		
	}

	/** Command: Turn Volume Up */
	export type VolumeUp = {
		
	}

	/** Command: Toggle Shuffle */
	export type ToggleShuffle = {
		
	}

	/** Command: Devices */
	export type Devices = {
		
	}
}