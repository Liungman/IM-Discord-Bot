import type { EventModule } from '../types/event.js';
import { ChannelType, PermissionsBitField, PermissionFlagsBits, type TextChannel } from 'discord.js';
import { getGuildSettings } from '../storage/guildSettings.js';
import { defaultEmbed } from '../lib/embeds.js';

// Track join counts per guild
const joinTracker: Map<string, number[]> = new Map(); // guildId -> timestamps

function cleanOldJoins(guildId: string, windowMs: number): void {
  const now = Date.now();
  const joins = joinTracker.get(guildId) || [];
  const recent = joins.filter(timestamp => now - timestamp < windowMs);
  joinTracker.set(guildId, recent);
}

function addJoin(guildId: string): number {
  const joins = joinTracker.get(guildId) || [];
  joins.push(Date.now());
  joinTracker.set(guildId, joins);
  return joins.length;
}

async function executeAntiRaidAction(guild: any, settings: any, joinCount: number): Promise<void> {
  if (settings.antiRaid.action.type === 'lockdown') {
    const minutes = settings.antiRaid.action.minutes || 10;
    
    // Lock all text channels for @everyone
    const channels = guild.channels.cache.filter((channel: any) =>
      [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildVoice].includes(channel.type)
    );
    
    const everyoneRole = guild.roles.everyone;
    let lockedCount = 0;
    
    for (const [, channel] of channels) {
      try {
        await channel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: false,
        });
        lockedCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit protection
      } catch (error) {
        console.error(`Failed to lock channel ${channel.name}:`, error);
      }
    }
    
    // Log the action
    if (settings.antiRaid.logChannelId) {
      const logChannel = guild.channels.cache.get(settings.antiRaid.logChannelId) as TextChannel;
      if (logChannel) {
        const logEmbed = defaultEmbed(guild)
          .setTitle('🚨 Anti-Raid Triggered')
          .setDescription(`Automatic lockdown initiated due to suspicious join activity.`)
          .addFields(
            { name: 'Trigger', value: `${joinCount} joins within ${settings.antiRaid.windowMs / 1000} seconds` },
            { name: 'Action', value: `Locked ${lockedCount} channels for ${minutes} minutes` },
            { name: 'Duration', value: `<t:${Math.floor((Date.now() + minutes * 60 * 1000) / 1000)}:R>` }
          )
          .setColor(0xff0000)
          .setTimestamp();
        
        try {
          await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
          console.error('Failed to send anti-raid log:', error);
        }
      }
    }
    
    // Schedule unlock
    setTimeout(async () => {
      let unlockedCount = 0;
      
      for (const [, channel] of channels) {
        try {
          // Check if @everyone is currently denied SendMessages
          const currentOverwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);
          
          if (currentOverwrite?.deny.has(PermissionFlagsBits.SendMessages)) {
            await channel.permissionOverwrites.edit(everyoneRole, {
              SendMessages: null, // Remove the explicit denial
            });
            unlockedCount++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit protection
          }
        } catch (error) {
          console.error(`Failed to unlock channel ${channel.name}:`, error);
        }
      }
      
      // Log the unlock
      if (settings.antiRaid.logChannelId) {
        const logChannel = guild.channels.cache.get(settings.antiRaid.logChannelId) as TextChannel;
        if (logChannel) {
          const unlockEmbed = defaultEmbed(guild)
            .setTitle('🔓 Anti-Raid Lockdown Ended')
            .setDescription('Automatic lockdown period has expired.')
            .addFields({ name: 'Unlocked', value: `${unlockedCount} channels` })
            .setColor(0x00ff00)
            .setTimestamp();
          
          try {
            await logChannel.send({ embeds: [unlockEmbed] });
          } catch (error) {
            console.error('Failed to send anti-raid unlock log:', error);
          }
        }
      }
    }, minutes * 60 * 1000);
  }
}

const mod: EventModule = {
  name: 'guildMemberAdd',
  async execute(_client, member) {
    const guild = member.guild;
    const settings = getGuildSettings(guild.id);
    
    if (!settings.antiRaid?.enabled) return;
    
    const windowMs = settings.antiRaid.windowMs || 60000;
    const threshold = settings.antiRaid.joinThreshold || 8;
    
    // Clean old joins and add this join
    cleanOldJoins(guild.id, windowMs);
    const joinCount = addJoin(guild.id);
    
    // Check if threshold exceeded
    if (joinCount >= threshold) {
      console.log(`Anti-raid triggered in ${guild.name}: ${joinCount} joins in ${windowMs}ms`);
      
      try {
        await executeAntiRaidAction(guild, settings, joinCount);
      } catch (error) {
        console.error('Anti-raid action failed:', error);
      }
      
      // Reset join tracker after action
      joinTracker.set(guild.id, []);
    }
  },
};

export default mod;