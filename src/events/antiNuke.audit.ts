import type { EventModule } from '../types/event.js';
import { AuditLogEvent, PermissionFlagsBits } from 'discord.js';
import { getGuildSettings } from '../storage/guildSettings.js';

type CounterKey = 'ChannelCreate' | 'ChannelDelete' | 'RoleCreate' | 'RoleDelete' | 'MemberBanAdd';
type CounterBucket = Partial<Record<CounterKey, number>> & { last: number };

const counters: Map<string, Map<string, CounterBucket>> = new Map(); // guildId -> executorId -> counters

function bump(guildId: string, executorId: string, key: CounterKey, windowMs: number) {
  const g = counters.get(guildId) ?? new Map();
  const now = Date.now();
  const e = g.get(executorId) ?? { last: now } as CounterBucket;
  if (now - (e.last || 0) > windowMs) {
    e.ChannelCreate = 0;
    e.ChannelDelete = 0;
    e.RoleCreate = 0;
    e.RoleDelete = 0;
    e.MemberBanAdd = 0;
  }
  e[key] = (e[key] ?? 0) + 1;
  e.last = now;
  g.set(executorId, e);
  counters.set(guildId, g);
  return e[key]!;
}

const mod: EventModule = {
  name: 'guildAuditLogEntryCreate',
  async execute(_client, entry, guild) {
    const s = getGuildSettings(guild.id);
    if (!s.antiNuke.enabled) return;

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
      const member = await guild.members.fetch(executorId).catch(() => null);
      if (member && member.manageable && guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await member.timeout(s.antiNuke.action.ms, `Anti-nuke: exceeded ${key} threshold`).catch(() => {});
      }
      const channelId = s.antiNuke.logChannelId;
      if (channelId) {
        const ch = (await guild.channels.fetch(channelId).catch(() => null)) as any;
        if (ch?.isTextBased()) {
          ch.send(
            `Anti-nuke: ${member?.user.tag ?? executorId} exceeded ${key} threshold (${count}/${threshold}) and was actioned.`,
          );
        }
      }
      counters.get(guild.id)?.delete(executorId);
    }
  },
};

export default mod;