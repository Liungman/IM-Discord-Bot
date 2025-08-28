import type { EventModule } from '../types/event.js';
import { AuditLogEvent, PermissionFlagsBits } from 'discord.js';
import { getGuildSettings } from '../storage/guildSettings.js';

type CounterKey = 'ChannelCreate'|'ChannelDelete'|'RoleCreate'|'RoleDelete'|'MemberBanAdd';
const counters: Map<string, Map<string, { [K in CounterKey]?: number; last: number }>> = new Map(); // guildId -> executorId -> counters

function bump(guildId: string, executorId: string, key: CounterKey, windowMs: number) {
  const g = counters.get(guildId) ?? new Map();
  const now = Date.now();
  const e = g.get(executorId) ?? { last: now };
  if (now - (e.last || 0) > windowMs) {
    for (const k of ['ChannelCreate','ChannelDelete','RoleCreate','RoleDelete','MemberBanAdd'] as CounterKey[]) {
      (e as any)[k] = 0;
    }
  }
  e[key] = (e[key] ?? 0) + 1;
  e.last = now;
  g.set(executorId, e);
  counters.set(guildId, g);
  return e[key]!;
}

const mod: EventModule = {
  name: 'guildAuditLogEntryCreate',
  async execute(client, entry, guild) {
    const s = getGuildSettings(guild.id);
    if (!s.antiNuke.enabled) return;

    // Only track configured events
    const map: Partial<Record<number, CounterKey>> = {
      [AuditLogEvent.ChannelCreate]: 'ChannelCreate',
      [AuditLogEvent.ChannelDelete]: 'ChannelDelete',
      [AuditLogEvent.RoleCreate]: 'RoleCreate',
      [AuditLogEvent.RoleDelete]: 'RoleDelete',
      [AuditLogEvent.MemberBanAdd]: 'MemberBanAdd',
    };
    const key = map[entry.action as number];
    if (!key) return;

    const executorId = entry.executorId;
    if (!executorId) return;

    const count = bump(guild.id, executorId, key, s.antiNuke.windowMs);
    const threshold = s.antiNuke.thresholds[key] ?? Infinity;

    if (count >= threshold) {
      // Take action
      const member = await guild.members.fetch(executorId).catch(() => null);
      if (member && member.manageable && guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await member.timeout(s.antiNuke.action.ms, `Anti-nuke: exceeded ${key} threshold`).catch(() => {});
      }
      // Log
      const channelId = s.antiNuke.logChannelId;
      if (channelId) {
        const ch = await guild.channels.fetch(channelId).catch(() => null) as any;
        if (ch?.isTextBased()) {
          ch.send(`Anti-nuke: ${member?.user.tag ?? executorId} exceeded ${key} threshold (${count}/${threshold}) and was actioned.`);
        }
      }
      // Reset counts for this executor
      counters.get(guild.id)?.delete(executorId);
    }
  },
};

export default mod;