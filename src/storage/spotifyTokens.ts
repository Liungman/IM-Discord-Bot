import { getNamespace, setNamespace } from './kv.js';

export interface SpotifyTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  userId: string;
}

type DB = Record<string, SpotifyTokenData>;
const KEY = 'spotifyTokens';

function db(): DB {
  return getNamespace<DB>(KEY);
}

export function getSpotifyToken(userId: string): SpotifyTokenData | null {
  const d = db();
  const token = d[userId];
  
  // Check if token exists and is not expired
  if (!token) return null;
  if (token.expiresAt <= Date.now()) return null;
  
  return token;
}

export function setSpotifyToken(userId: string, token: SpotifyTokenData): void {
  const d = db();
  d[userId] = token;
  setNamespace(KEY, d);
}

export function removeSpotifyToken(userId: string): void {
  const d = db();
  delete d[userId];
  setNamespace(KEY, d);
}

export function hasValidSpotifyToken(userId: string): boolean {
  return getSpotifyToken(userId) !== null;
}