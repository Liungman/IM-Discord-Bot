import { Guild, VoiceChannel, PermissionFlagsBits, ChannelType } from 'discord.js';
import { logger } from '../core/logger.js';
import { getGuildSettings } from '../storage/guildSettings.js';

export interface TempVoiceChannel {
  channelId: string;
  guildId: string;
  ownerId: string;
  createdAt: number;
  lastActivity: number;
  cleanupTimer?: NodeJS.Timeout;
}

class TempVoiceManagerSingleton {
  private tempChannels = new Map<string, TempVoiceChannel>();

  async createTempChannel(
    guild: Guild,
    ownerId: string,
    name?: string,
    userLimit?: number
  ): Promise<VoiceChannel | null> {
    const settings = getGuildSettings(guild.id);
    
    if (!settings.tempVoice.categoryId) {
      logger.warn({ guildId: guild.id }, 'Temp voice category not configured');
      return null;
    }

    const category = guild.channels.cache.get(settings.tempVoice.categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      logger.warn({ guildId: guild.id, categoryId: settings.tempVoice.categoryId }, 'Invalid temp voice category');
      return null;
    }

    try {
      const channelName = name || `${guild.members.cache.get(ownerId)?.displayName || 'User'}'s Channel`;
      
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category,
        userLimit: userLimit || 0,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          },
          {
            id: ownerId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
            ],
          },
        ],
      }) as VoiceChannel;

      const tempChannel: TempVoiceChannel = {
        channelId: channel.id,
        guildId: guild.id,
        ownerId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      this.tempChannels.set(channel.id, tempChannel);
      this.scheduleCleanup(tempChannel);

      logger.info({ 
        guildId: guild.id, 
        channelId: channel.id, 
        ownerId 
      }, 'Created temporary voice channel');

      return channel;
    } catch (error) {
      logger.error({ guildId: guild.id, ownerId, error }, 'Failed to create temporary voice channel');
      return null;
    }
  }

  async deleteTempChannel(channelId: string): Promise<boolean> {
    const tempChannel = this.tempChannels.get(channelId);
    if (!tempChannel) return false;

    try {
      // Clear cleanup timer
      if (tempChannel.cleanupTimer) {
        clearTimeout(tempChannel.cleanupTimer);
      }

      // Get the Discord client from global (set in main)
      const client = (globalThis as any).client;
      if (!client) {
        logger.warn({ channelId }, 'Discord client not available for temp channel cleanup');
        return false;
      }

      const guild = client.guilds.cache.get(tempChannel.guildId);
      if (!guild) {
        logger.warn({ guildId: tempChannel.guildId, channelId }, 'Guild not found for temp channel cleanup');
        this.tempChannels.delete(channelId);
        return false;
      }

      const channel = guild.channels.cache.get(channelId);
      if (channel) {
        await channel.delete('Temporary voice channel cleanup');
        logger.info({ guildId: tempChannel.guildId, channelId }, 'Deleted temporary voice channel');
      }

      this.tempChannels.delete(channelId);
      return true;
    } catch (error) {
      logger.error({ channelId, error }, 'Failed to delete temporary voice channel');
      this.tempChannels.delete(channelId); // Remove from tracking even if deletion failed
      return false;
    }
  }

  isTempChannel(channelId: string): boolean {
    return this.tempChannels.has(channelId);
  }

  getTempChannel(channelId: string): TempVoiceChannel | null {
    return this.tempChannels.get(channelId) || null;
  }

  updateActivity(channelId: string): void {
    const tempChannel = this.tempChannels.get(channelId);
    if (tempChannel) {
      tempChannel.lastActivity = Date.now();
      this.scheduleCleanup(tempChannel);
    }
  }

  async lockChannel(channelId: string, guildId: string): Promise<boolean> {
    const tempChannel = this.tempChannels.get(channelId);
    if (!tempChannel) return false;

    try {
      const client = (globalThis as any).client;
      const guild = client?.guilds.cache.get(guildId);
      const channel = guild?.channels.cache.get(channelId) as VoiceChannel;
      
      if (!channel) return false;

      await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
        Connect: false,
        Speak: false,
      });

      logger.info({ guildId, channelId }, 'Locked temporary voice channel');
      return true;
    } catch (error) {
      logger.error({ guildId, channelId, error }, 'Failed to lock temporary voice channel');
      return false;
    }
  }

  async unlockChannel(channelId: string, guildId: string): Promise<boolean> {
    const tempChannel = this.tempChannels.get(channelId);
    if (!tempChannel) return false;

    try {
      const client = (globalThis as any).client;
      const guild = client?.guilds.cache.get(guildId);
      const channel = guild?.channels.cache.get(channelId) as VoiceChannel;
      
      if (!channel) return false;

      await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
        Connect: true,
        Speak: true,
      });

      logger.info({ guildId, channelId }, 'Unlocked temporary voice channel');
      return true;
    } catch (error) {
      logger.error({ guildId, channelId, error }, 'Failed to unlock temporary voice channel');
      return false;
    }
  }

  async setUserPermission(
    channelId: string,
    guildId: string,
    userId: string,
    allow: boolean
  ): Promise<boolean> {
    const tempChannel = this.tempChannels.get(channelId);
    if (!tempChannel) return false;

    try {
      const client = (globalThis as any).client;
      const guild = client?.guilds.cache.get(guildId);
      const channel = guild?.channels.cache.get(channelId) as VoiceChannel;
      
      if (!channel) return false;

      if (allow) {
        await channel.permissionOverwrites.edit(userId, {
          Connect: true,
          Speak: true,
        });
      } else {
        await channel.permissionOverwrites.edit(userId, {
          Connect: false,
          Speak: false,
        });
      }

      logger.info({ 
        guildId, 
        channelId, 
        userId, 
        action: allow ? 'allowed' : 'denied' 
      }, 'Updated user permission for temporary voice channel');
      
      return true;
    } catch (error) {
      logger.error({ guildId, channelId, userId, error }, 'Failed to update user permission');
      return false;
    }
  }

  private scheduleCleanup(tempChannel: TempVoiceChannel): void {
    // Clear existing timer
    if (tempChannel.cleanupTimer) {
      clearTimeout(tempChannel.cleanupTimer);
    }

    // Schedule new cleanup
    const settings = getGuildSettings(tempChannel.guildId);
    const timeoutMs = settings.tempVoice.inactivityTimeoutMs;

    tempChannel.cleanupTimer = setTimeout(async () => {
      // Check if channel is still empty
      const client = (globalThis as any).client;
      const guild = client?.guilds.cache.get(tempChannel.guildId);
      const channel = guild?.channels.cache.get(tempChannel.channelId) as VoiceChannel;
      
      if (channel && channel.members.size === 0) {
        await this.deleteTempChannel(tempChannel.channelId);
      }
    }, timeoutMs);
  }

  // Called when a user joins/leaves a voice channel
  handleVoiceStateUpdate(oldChannelId: string | null, newChannelId: string | null): void {
    // Update activity for temp channels
    if (oldChannelId && this.isTempChannel(oldChannelId)) {
      this.updateActivity(oldChannelId);
    }
    if (newChannelId && this.isTempChannel(newChannelId)) {
      this.updateActivity(newChannelId);
    }
  }
}

export const TempVoiceManager = new TempVoiceManagerSingleton();