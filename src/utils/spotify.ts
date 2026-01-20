import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';
import { getPreferenceValues, LocalStorage, showToast, Toast, open } from '@vicinae/api';
import * as crypto from 'crypto';
import * as http from 'http';

interface Preferences {
  clientId: string;
}

interface StoredToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  expires_at?: number;
}

let spotifyClient: SpotifyApi | null = null;
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
  'user-read-email',
  'user-read-private',
];

/**
 * Generate random string for state parameter
 */
function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Base64 URL encode
 */
function base64URLEncode(str: Buffer): string {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate code verifier and challenge for PKCE
 */
function generatePKCE() {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );
  return { verifier, challenge };
}

/**
 * Start OAuth flow and get access token (PKCE - client ID only)
 */
async function performOAuthFlow(clientId: string): Promise<StoredToken> {
  console.log('[Vicify] Starting OAuth flow with PKCE...');

  const state = generateRandomString(16);
  const { verifier, challenge } = generatePKCE();

  // Store verifier for later use
  await LocalStorage.setItem('spotify_code_verifier', verifier);
  await LocalStorage.setItem('spotify_state', state);

  // Build authorization URL
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', challenge);

  console.log('[Vicify] Authorization URL created');

  // Return a promise that resolves when we get the callback
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      console.log('[Vicify] Received callback:', req.url);

      if (!req.url?.startsWith('/callback')) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const url = new URL(req.url, `http://localhost:8888`);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        console.error('[Vicify] OAuth error:', error);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authentication failed</h1><p>You can close this window.</p></body></html>');
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      const storedState = await LocalStorage.getItem<string>('spotify_state');

      if (returnedState !== storedState) {
        console.error('[Vicify] State mismatch!');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authentication failed</h1><p>State mismatch. Please try again.</p></body></html>');
        server.close();
        reject(new Error('State mismatch'));
        return;
      }

      if (!code) {
        console.error('[Vicify] No code received');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authentication failed</h1><p>No authorization code received.</p></body></html>');
        server.close();
        reject(new Error('No authorization code'));
        return;
      }

      try {
        console.log('[Vicify] Exchanging code for token using PKCE...');
        const storedVerifier = await LocalStorage.getItem<string>('spotify_code_verifier');

        // Exchange code for access token using PKCE (no client secret)
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            client_id: clientId,
            code_verifier: storedVerifier || '',
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error('[Vicify] Token exchange failed:', errorData);
          throw new Error(`Token exchange failed: ${errorData}`);
        }

        const tokenData: StoredToken = await tokenResponse.json();
        tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);

        console.log('[Vicify] Token received successfully');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Success!</h1><p>Authentication successful. You can close this window.</p></body></html>');
        server.close();

        // Clean up stored state and verifier
        await LocalStorage.removeItem('spotify_state');
        await LocalStorage.removeItem('spotify_code_verifier');

        resolve(tokenData);
      } catch (error) {
        console.error('[Vicify] Error during token exchange:', error);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Authentication failed</h1><p>Error exchanging code for token.</p></body></html>');
        server.close();
        reject(error);
      }
    });

    server.listen(8888, () => {
      console.log('[Vicify] Local server started on port 8888');
      console.log('[Vicify] Opening browser for authentication...');

      // Open browser for user to authenticate
      open(authUrl.toString()).catch(err => {
        console.error('[Vicify] Failed to open browser:', err);
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('OAuth flow timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Refresh the access token using the refresh token (PKCE - client ID only)
 */
async function refreshAccessToken(refreshToken: string, clientId: string): Promise<StoredToken> {
  console.log('[Vicify] Refreshing token with PKCE...');

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    console.error('[Vicify] Token refresh failed:', errorData);
    throw new Error(`Token refresh failed: ${errorData}`);
  }

  const newToken: StoredToken = await tokenResponse.json();

  // Spotify doesn't always return a new refresh token, so preserve the old one
  if (!newToken.refresh_token) {
    newToken.refresh_token = refreshToken;
  }

  newToken.expires_at = Date.now() + (newToken.expires_in * 1000);

  console.log('[Vicify] Token refreshed successfully');
  return newToken;
}

/**
 * Get or create Spotify API client instance
 */
export async function getSpotifyClient(): Promise<SpotifyApi> {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.clientId) {
    console.error('[Vicify] Missing Client ID!');
    await showToast({
      style: Toast.Style.Failure,
      title: 'Missing Spotify Client ID',
      message: 'Please add your Client ID in extension preferences',
    });
    throw new Error('Missing Spotify Client ID');
  }

  try {
    // Check for stored token
    const storedTokenJson = await LocalStorage.getItem<string>('spotify_token_data');
    let storedToken: StoredToken | null = null;

    if (storedTokenJson) {
      try {
        storedToken = JSON.parse(storedTokenJson);
      } catch (e) {
        console.error('[Vicify] Failed to parse stored token:', e);
        await LocalStorage.removeItem('spotify_token_data');
      }
    }

    // Add 5-minute buffer before expiration to proactively refresh tokens
    const EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    // Check if we have a valid token that's not about to expire
    if (storedToken && storedToken.expires_at && storedToken.expires_at > (now + EXPIRY_BUFFER)) {
      // Reuse existing client if available, otherwise create new one
      if (!spotifyClient) {
        spotifyClient = SpotifyApi.withAccessToken(preferences.clientId, storedToken as AccessToken);
      }
      return spotifyClient;
    }

    // Token is expired or about to expire - try to refresh it
    if (storedToken?.refresh_token) {
      try {
        const newToken = await refreshAccessToken(
          storedToken.refresh_token,
          preferences.clientId
        );

        await LocalStorage.setItem('spotify_token_data', JSON.stringify(newToken));

        console.log('[Vicify] Creating client with refreshed token');
        spotifyClient = SpotifyApi.withAccessToken(preferences.clientId, newToken as AccessToken);

        return spotifyClient;
      } catch (error) {
        console.error('[Vicify] Token refresh failed, will need to re-authenticate:', error);
        // Clear invalid token
        await LocalStorage.removeItem('spotify_token_data');
      }
    }

    // No valid token or refresh failed - perform OAuth flow
    console.log('[Vicify] Starting new OAuth flow with PKCE...');
    await showToast({
      style: Toast.Style.Animated,
      title: 'Authenticating...',
      message: 'Opening browser for Spotify login',
    });

    const tokenData = await performOAuthFlow(preferences.clientId);
    await LocalStorage.setItem('spotify_token_data', JSON.stringify(tokenData));

    console.log('[Vicify] OAuth complete, creating client');
    spotifyClient = SpotifyApi.withAccessToken(preferences.clientId, tokenData as AccessToken);

    await showToast({
      style: Toast.Style.Success,
      title: 'Authenticated!',
      message: 'Successfully connected to Spotify',
    });

    return spotifyClient;
  } catch (error) {
    console.error('[Vicify] Failed to initialize Spotify client:', error);
    console.error('[Vicify] Error details:', JSON.stringify(error, null, 2));

    await showToast({
      style: Toast.Style.Failure,
      title: 'Failed to initialize Spotify',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Format milliseconds to MM:SS format
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format artist names from array
 */
export function formatArtists(artists: Array<{ name: string }>): string {
  return artists.map(artist => artist.name).join(', ');
}

/**
 * Get cached access token
 */
export async function getCachedToken(): Promise<string | null> {
  const token = await LocalStorage.getItem<string>('spotify_access_token');
  return token ?? null;
}

/**
 * Cache access token
 */
export async function cacheToken(token: string): Promise<void> {
  await LocalStorage.setItem('spotify_access_token', token);
}

/**
 * Clear cached token
 */
export async function clearToken(): Promise<void> {
  await LocalStorage.removeItem('spotify_access_token');
  spotifyClient = null;
}

/**
 * Handle Spotify API errors
 */
export async function handleSpotifyError(error: unknown, defaultMessage: string): Promise<void> {
  console.error('[Vicify] Spotify Error:', error);
  console.error('[Vicify] Error type:', typeof error);
  console.error('[Vicify] Error details:', JSON.stringify(error, null, 2));
  
  let message = defaultMessage;
  
  if (error instanceof Error) {
    message = error.message;
    console.error('[Vicify] Error message:', message);
    console.error('[Vicify] Error stack:', error.stack);
  }

  await showToast({
    style: Toast.Style.Failure,
    title: 'Spotify Error',
    message,
  });
}

/**
 * Safe wrapper for Spotify API calls that may return 204 No Content
 * The SDK has a bug where it tries to parse empty responses as JSON
 */
export async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<T | void> {
  try {
    return await apiCall();
  } catch (error) {
    // If it's a JSON parse error (SyntaxError from JSON.parse), 
    // the operation likely succeeded with 204 No Content
    if (error instanceof SyntaxError && 
        (error.message.includes('JSON') || 
         error.message.includes('Unexpected') ||
         error.message.toLowerCase().includes('parse'))) {
      // Don't log this error - it's expected for successful 204 responses
      return;
    }
    // Re-throw other errors (authentication, network, etc.)
    throw error;
  }
}
