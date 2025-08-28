import { getNamespace, setNamespace } from './kv.js';
import { DefaultSettings } from '../config/defaults.js';

type Settings = typeof DefaultSettings;
type DB = Record<string, Settings>;

const KEY = 'guildSettings';

function db(): DB {
  return getNamespace<DB>(KEY);
}

export function getGuildSettings(guildId: string): Settings {
  const d = db();
  d[guildId] = d[guildId] ?? JSON.parse(JSON.stringify(DefaultSettings));
  return d[guildId]!;
}

export function setGuildSettings(guildId: string, settings: Partial<Settings>) {
  const d = db();
  d[guildId] = { ...getGuildSettings(guildId), ...settings } as Settings;
  setNamespace(KEY, d);
}

export function patchGuildSettings(guildId: string, path: string[], value: any) {
  const s = getGuildSettings(guildId);
  let cur: any = s;
  for (let i = 0; i < path.length - 1; i++) {
    cur[path[i]] = cur[path[i]] ?? {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
  setGuildSettings(guildId, s);
}