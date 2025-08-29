import type { EventModule } from '../types/event.js';
import { getGuildSettings } from '../storage/guildSettings.js';
import { defaultEmbed } from '../lib/embeds.js';

const mod: EventModule = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    const settings = getGuildSettings(member.guild.id);
    
    if (!settings.welcomeLeave.enabled || !settings.welcomeLeave.welcomeChannelId) {
      return;
    }

    const welcomeChannel = member.guild.channels.cache.get(settings.welcomeLeave.welcomeChannelId);
    if (!welcomeChannel || !welcomeChannel.isTextBased()) {
      return;
    }

    try {
      // Replace variables in welcome message
      const welcomeMessage = settings.welcomeLeave.welcomeMessage
        .replace(/{user}/g, member.toString())
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name);

      // Send welcome message to channel
      const embed = defaultEmbed(member.guild)
        .setTitle('👋 Welcome!')
        .setDescription(welcomeMessage)
        .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
        .setFooter({ text: `Member #${member.guild.memberCount}` })
        .setTimestamp();

      await welcomeChannel.send({ embeds: [embed] });

      // Send DM welcome if enabled
      if (settings.welcomeLeave.dmWelcome) {
        try {
          const dmMessage = settings.welcomeLeave.dmWelcomeMessage
            .replace(/{user}/g, member.user.username)
            .replace(/{username}/g, member.user.username)
            .replace(/{server}/g, member.guild.name);

          const dmEmbed = defaultEmbed()
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(dmMessage)
            .setThumbnail(member.guild.iconURL({ size: 128 }));

          await member.send({ embeds: [dmEmbed] });
        } catch (error) {
          // DM failed, user probably has DMs disabled - ignore silently
        }
      }
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  },
};

export default mod;