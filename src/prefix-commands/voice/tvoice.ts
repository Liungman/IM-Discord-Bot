import type { PrefixCommand } from '../../types/prefixCommand.js';
import { GuildMember } from 'discord.js';
import { errorEmbed, successEmbed } from '../../lib/embeds.js';
import { TempVoiceManager } from '../../lib/TempVoiceManager.js';

const createCommand: PrefixCommand = {
  name: 'tvoice create',
  description: 'Create a temporary voice channel.',
  usage: '?tvoice create [name] [--limit N]',
  category: 'voice',
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    if (!member) return;

    // Parse arguments
    let channelName: string | undefined;
    let userLimit: number | undefined;

    const limitIndex = args.findIndex(arg => arg === '--limit');
    if (limitIndex !== -1 && limitIndex < args.length - 1) {
      const limitValue = parseInt(args[limitIndex + 1]);
      if (!isNaN(limitValue) && limitValue >= 0 && limitValue <= 99) {
        userLimit = limitValue;
      }
      // Remove --limit and its value from args
      args.splice(limitIndex, 2);
    }

    // Remaining args are the channel name
    if (args.length > 1) {
      channelName = args.slice(1).join(' ');
    }

    try {
      const channel = await TempVoiceManager.createTempChannel(
        message.guild,
        member.id,
        channelName,
        userLimit
      );

      if (!channel) {
        await message.reply({ 
          embeds: [errorEmbed('Failed to create temporary voice channel. Make sure the temp voice category is configured.')] 
        });
        return;
      }

      // Move the user to the channel if they're in a voice channel
      if (member.voice.channel) {
        try {
          await member.voice.setChannel(channel);
        } catch {
          // Ignore if we can't move them
        }
      }

      await message.reply({ 
        embeds: [successEmbed(`🔊 Created temporary voice channel: **${channel.name}**\nChannel will be deleted when empty for 5 minutes.`)] 
      });

    } catch (error) {
      await message.reply({ 
        embeds: [errorEmbed('An error occurred while creating the temporary voice channel.')] 
      });
    }
  },
};

const lockCommand: PrefixCommand = {
  name: 'tvoice lock',
  description: 'Lock your temporary voice channel (prevent others from joining).',
  usage: '?tvoice lock',
  category: 'voice',
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    if (!member || !member.voice.channel) {
      await message.reply({ 
        embeds: [errorEmbed('You must be in a voice channel to use this command.')] 
      });
      return;
    }

    const channelId = member.voice.channel.id;
    const tempChannel = TempVoiceManager.getTempChannel(channelId);

    if (!tempChannel) {
      await message.reply({ 
        embeds: [errorEmbed('This is not a temporary voice channel.')] 
      });
      return;
    }

    if (tempChannel.ownerId !== member.id) {
      await message.reply({ 
        embeds: [errorEmbed('Only the channel owner can lock the channel.')] 
      });
      return;
    }

    const success = await TempVoiceManager.lockChannel(channelId, message.guild.id);
    if (success) {
      await message.reply({ 
        embeds: [successEmbed('🔒 Locked the temporary voice channel.')] 
      });
    } else {
      await message.reply({ 
        embeds: [errorEmbed('Failed to lock the channel.')] 
      });
    }
  },
};

const unlockCommand: PrefixCommand = {
  name: 'tvoice unlock',
  description: 'Unlock your temporary voice channel (allow others to join).',
  usage: '?tvoice unlock',
  category: 'voice',
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    if (!member || !member.voice.channel) {
      await message.reply({ 
        embeds: [errorEmbed('You must be in a voice channel to use this command.')] 
      });
      return;
    }

    const channelId = member.voice.channel.id;
    const tempChannel = TempVoiceManager.getTempChannel(channelId);

    if (!tempChannel) {
      await message.reply({ 
        embeds: [errorEmbed('This is not a temporary voice channel.')] 
      });
      return;
    }

    if (tempChannel.ownerId !== member.id) {
      await message.reply({ 
        embeds: [errorEmbed('Only the channel owner can unlock the channel.')] 
      });
      return;
    }

    const success = await TempVoiceManager.unlockChannel(channelId, message.guild.id);
    if (success) {
      await message.reply({ 
        embeds: [successEmbed('🔓 Unlocked the temporary voice channel.')] 
      });
    } else {
      await message.reply({ 
        embeds: [errorEmbed('Failed to unlock the channel.')] 
      });
    }
  },
};

const inviteCommand: PrefixCommand = {
  name: 'tvoice invite',
  description: 'Invite a user to your temporary voice channel.',
  usage: '?tvoice invite @user',
  category: 'voice',
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    if (!member || !member.voice.channel) {
      await message.reply({ 
        embeds: [errorEmbed('You must be in a voice channel to use this command.')] 
      });
      return;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      await message.reply({ 
        embeds: [errorEmbed('Please mention a user to invite: `?tvoice invite @user`')] 
      });
      return;
    }

    const channelId = member.voice.channel.id;
    const tempChannel = TempVoiceManager.getTempChannel(channelId);

    if (!tempChannel) {
      await message.reply({ 
        embeds: [errorEmbed('This is not a temporary voice channel.')] 
      });
      return;
    }

    if (tempChannel.ownerId !== member.id) {
      await message.reply({ 
        embeds: [errorEmbed('Only the channel owner can invite users.')] 
      });
      return;
    }

    const success = await TempVoiceManager.setUserPermission(
      channelId,
      message.guild.id,
      targetUser.id,
      true
    );

    if (success) {
      await message.reply({ 
        embeds: [successEmbed(`✅ Invited **${targetUser.username}** to the voice channel.`)] 
      });
    } else {
      await message.reply({ 
        embeds: [errorEmbed('Failed to invite the user.')] 
      });
    }
  },
};

const removeCommand: PrefixCommand = {
  name: 'tvoice remove',
  description: 'Remove a user from your temporary voice channel.',
  usage: '?tvoice remove @user',
  category: 'voice',
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    if (!member || !member.voice.channel) {
      await message.reply({ 
        embeds: [errorEmbed('You must be in a voice channel to use this command.')] 
      });
      return;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      await message.reply({ 
        embeds: [errorEmbed('Please mention a user to remove: `?tvoice remove @user`')] 
      });
      return;
    }

    const channelId = member.voice.channel.id;
    const tempChannel = TempVoiceManager.getTempChannel(channelId);

    if (!tempChannel) {
      await message.reply({ 
        embeds: [errorEmbed('This is not a temporary voice channel.')] 
      });
      return;
    }

    if (tempChannel.ownerId !== member.id) {
      await message.reply({ 
        embeds: [errorEmbed('Only the channel owner can remove users.')] 
      });
      return;
    }

    const success = await TempVoiceManager.setUserPermission(
      channelId,
      message.guild.id,
      targetUser.id,
      false
    );

    if (success) {
      // Also try to disconnect the user if they're in the channel
      try {
        const targetMember = message.guild.members.cache.get(targetUser.id);
        if (targetMember && targetMember.voice.channel?.id === channelId) {
          await targetMember.voice.disconnect('Removed from temporary voice channel');
        }
      } catch {
        // Ignore if we can't disconnect them
      }

      await message.reply({ 
        embeds: [successEmbed(`❌ Removed **${targetUser.username}** from the voice channel.`)] 
      });
    } else {
      await message.reply({ 
        embeds: [errorEmbed('Failed to remove the user.')] 
      });
    }
  },
};

export default [createCommand, lockCommand, unlockCommand, inviteCommand, removeCommand];