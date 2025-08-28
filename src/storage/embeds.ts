import { getNamespace, setNamespace } from './kv.js';

type EmbedMap = Record<string, any>; // guildId -> { [name]: embedData }

export function listEmbeds(guildId: string): string[] {
  const db = getNamespace<EmbedMap>('embeds');
  return Object.keys(db[guildId] ?? {});
}

export function getEmbed(guildId: string, name: string): any | null {
  const db = getNamespace<EmbedMap>('embeds');
  return db[guildId]?.[name] ?? null;
}

export function saveEmbed(guildId: string, name: string, embedData: any) {
  const db = getNamespace<EmbedMap>('embeds');
  db[guildId] = db[guildId] ?? {};
  db[guildId]![name] = embedData;
  setNamespace('embeds', db);
}

export function deleteEmbed(guildId: string, name: string): boolean {
  const db = getNamespace<EmbedMap>('embeds');
  if (!db[guildId]?.[name]) return false;
  delete db[guildId][name];
  setNamespace('embeds', db);
  return true;
}