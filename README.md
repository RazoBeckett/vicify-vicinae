# Vicify - Spotify Control Extension

A Vicinae extension for controlling Spotify playback, searching music, managing playlists, and more.

## Installation

Install the required dependencies and run the extension in development mode:

```bash
npm install
npm run dev
```

To build the production bundle:

```bash
npm run build
```

## Setup

### Spotify App Configuration

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Set the redirect URI to: `http://127.0.0.1:8888/callback`
4. Add the following scopes:
   - user-read-playback-state
   - user-modify-playback-state
   - user-read-currently-playing
   - user-read-recently-played
   - playlist-read-private
   - playlist-read-collaborative
   - playlist-modify-public
   - playlist-modify-private
   - user-library-read
   - user-library-modify
   - user-top-read
   - user-read-email
   - user-read-private
5. Copy your Client ID and Client Secret
6. In Vicinae, configure the extension with your Spotify credentials

## Features

- Control playback (play, pause, skip, previous)
- Adjust volume
- Search for tracks, artists, albums, and playlists
- View your library and playlists
- Manage your Liked Songs
- View queue and current playing track
- Switch between Spotify Connect devices
- Start Spotify DJ and radio
- Copy track info, URLs, and embed codes

## Device Persistence

The extension automatically remembers your last selected Spotify Connect device. When you open the extension, it will automatically switch to your previously used device. If the device is not found, it will retry once after 3.5 seconds.
