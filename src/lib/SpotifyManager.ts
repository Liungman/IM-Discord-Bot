import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import { logger } from '../core/logger.js';
import { isSpotifyEnabled } from '../config/env.js';
import { setSpotifyToken } from '../storage/spotifyTokens.js';

let spotifyApp: express.Express | null = null;
let spotifyServer: any = null;
let spotifyApi: SpotifyWebApi | null = null;

// Store pending OAuth states
const pendingStates = new Map<string, { userId: string; expires: number }>();

export function initializeSpotify(): SpotifyWebApi | null {
  if (!isSpotifyEnabled()) {
    logger.info('Spotify integration disabled - environment variables not configured');
    return null;
  }

  try {
    spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
    });

    spotifyApp = express();
    
    // OAuth callback endpoint
    spotifyApp.get('/callback', async (req, res) => {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      if (error) {
        logger.warn({ error }, 'Spotify OAuth error');
        res.status(400).send('Authorization failed');
        return;
      }

      if (!code || !state) {
        res.status(400).send('Missing authorization code or state');
        return;
      }

      const stateData = pendingStates.get(state);
      if (!stateData || stateData.expires < Date.now()) {
        pendingStates.delete(state);
        res.status(400).send('Invalid or expired state');
        return;
      }

      try {
        const data = await spotifyApi!.authorizationCodeGrant(code);
        const expiresAt = Date.now() + (data.body.expires_in * 1000);
        
        setSpotifyToken(stateData.userId, {
          accessToken: data.body.access_token,
          refreshToken: data.body.refresh_token,
          expiresAt,
          userId: stateData.userId,
        });

        pendingStates.delete(state);
        
        logger.info({ userId: stateData.userId }, 'Spotify token stored successfully');
        res.send(`
          <html>
            <head><title>Spotify Connected</title></head>
            <body>
              <h1>✅ Spotify Connected!</h1>
              <p>You can now close this window and return to Discord.</p>
              <script>setTimeout(() => window.close(), 3000);</script>
            </body>
          </html>
        `);
      } catch (error) {
        logger.error({ error, userId: stateData.userId }, 'Failed to exchange authorization code');
        res.status(500).send('Failed to complete authorization');
      }
    });

    // Health check endpoint
    spotifyApp.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'spotify-oauth' });
    });

    // Start server
    const port = parseInt(process.env.SPOTIFY_PORT || '3000');
    spotifyServer = spotifyApp.listen(port, () => {
      logger.info({ port }, 'Spotify OAuth server started');
    });

    return spotifyApi;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Spotify integration');
    return null;
  }
}

export function getSpotifyApi(): SpotifyWebApi | null {
  return spotifyApi;
}

export function generateSpotifyAuthUrl(userId: string): string | null {
  if (!spotifyApi) return null;

  const state = generateRandomState();
  const expires = Date.now() + (10 * 60 * 1000); // 10 minutes
  
  pendingStates.set(state, { userId, expires });

  // Clean up expired states
  for (const [key, value] of pendingStates.entries()) {
    if (value.expires < Date.now()) {
      pendingStates.delete(key);
    }
  }

  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-library-read',
    'user-library-modify',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-private',
    'user-read-email'
  ];

  return spotifyApi.createAuthorizeURL(scopes, state);
}

export function shutdownSpotify(): void {
  if (spotifyServer) {
    spotifyServer.close(() => {
      logger.info('Spotify OAuth server shut down');
    });
    spotifyServer = null;
  }
  spotifyApp = null;
  spotifyApi = null;
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}