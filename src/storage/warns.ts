import { getNamespace, setNamespace } from './kv.js';

type Warn = { by: string; reason: string; at: number };
type WarnDB = Record<string, Record<string, Warn[]>>; // guildId -> userId -> warns[]

const KEY = 'warns';

function db(): WarnDB {
  return getNamespace<WarnDB>(KEY);
}

export function addWarn(guildId: string, userId: string, warn: Warn) {
  const d = db();
  d[guildId] = d[guildId] ?? {};
  d[guildId][userId] = d[guildId][userId] ?? [];
  d[guildId][userId]!.push(warn);
  setNamespace(KEY, d);
}

export function getWarns(guildId: string, userId: string): Warn[] {
  const d = db();
  return d[guildId]?.[userId] ?? [];
}

export function clearWarns(guildId: string, userId: string): number {
  const d = db();
  const count = d[guildId]?.[userId]?.length ?? 0;
  if (d[guildId]?.[userId]) d[guildId][userId] = [];
  setNamespace(KEY, d);
  return count;
}