import type { EventModule } from '../types/event.js';
import { getGuildSettings } from '../storage/guildSettings.js';
import { defaultEmbed } from '../lib/embeds.js';

const mod: EventModule = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    const settings = getGuildSettings(member.guild.id);
    
    if (!settings.welcomeLeave.enabled) {
      return;
    }

    // Use leave channel if set, otherwise use welcome channel
    const channelId = settings.welcomeLeave.leaveChannelId || settings.welcomeLeave.welcomeChannelId;
    if (!channelId) {
      return;
    }

    const leaveChannel = member.guild.channels.cache.get(channelId);
    if (!leaveChannel || !leaveChannel.isTextBased()) {
      return;
    }

    try {
      // Replace variables in leave message
      const leaveMessage = settings.welcomeLeave.leaveMessage
        .replace(/{user}/g, member.user.username) // Can't mention user after they leave
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name);

      // Send leave message to channel
      const embed = defaultEmbed(member.guild)
        .setTitle('👋 Goodbye!')
        .setDescription(leaveMessage)
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setColor('#FF6B6B') // Slightly red tint for leave messages
        .setFooter({ text: `Member count: ${member.guild.memberCount}` })
        .setTimestamp();

      await leaveChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending leave message:', error);
    }
  },
};

export default mod;