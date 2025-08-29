import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType } from 'discord.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';

const command: PrefixCommand = {
  name: 'starboard',
  description: 'Configure the starboard system for highlighting popular messages.',
  usage: '?starboard [enable|disable|channel|threshold|emoji] [value]',
  category: 'utility',
  aliases: ['star', 'sb'],
  requiredPermissions: PermissionFlagsBits.ManageGuild,
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const settings = getGuildSettings(message.guild.id);

    if (args.length === 0) {
      // Show current starboard settings
      const embed = defaultEmbed(message.guild)
        .setTitle('⭐ Starboard Settings')
        .addFields(
          { name: 'Status', value: settings.starboard.enabled ? '✅ Enabled' : '❌ Disabled' },
          { name: 'Channel', value: settings.starboard.channelId ? `<#${settings.starboard.channelId}>` : 'Not set' },
          { name: 'Threshold', value: settings.starboard.threshold.toString(), inline: true },
          { name: 'Emoji', value: settings.starboard.emoji, inline: true },
          { name: 'Ignore NSFW', value: settings.starboard.ignoreNsfw ? 'Yes' : 'No', inline: true }
        )
        .setFooter({ text: 'Use ?starboard <setting> <value> to configure' });
      
      await message.reply({ embeds: [embed] });
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'enable':
        if (!settings.starboard.channelId) {
          await message.reply({ embeds: [errorEmbed('Please set a starboard channel first using `?starboard channel #channel`')] });
          return;
        }
        patchGuildSettings(message.guild.id, ['starboard', 'enabled'], true);
        await message.reply({ embeds: [successEmbed('Starboard system enabled!')] });
        break;

      case 'disable':
        patchGuildSettings(message.guild.id, ['starboard', 'enabled'], false);
        await message.reply({ embeds: [successEmbed('Starboard system disabled.')] });
        break;

      case 'channel':
        if (args.length < 2) {
          await message.reply({ embeds: [errorEmbed('Please mention a channel: `?starboard channel #starboard`')] });
          return;
        }

        const channelMention = args[1];
        const channelId = channelMention.replace(/[<#>]/g, '');
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel || channel.type !== ChannelType.GuildText) {
          await message.reply({ embeds: [errorEmbed('Please provide a valid text channel.')] });
          return;
        }

        patchGuildSettings(message.guild.id, ['starboard', 'channelId'], channel.id);
        await message.reply({ embeds: [successEmbed(`Starboard channel set to ${channel}`)] });
        break;

      case 'threshold':
        if (args.length < 2) {
          await message.reply({ embeds: [errorEmbed('Please provide a number: `?starboard threshold 5`')] });
          return;
        }

        const threshold = parseInt(args[1]);
        if (isNaN(threshold) || threshold < 1 || threshold > 50) {
          await message.reply({ embeds: [errorEmbed('Threshold must be a number between 1 and 50.')] });
          return;
        }

        patchGuildSettings(message.guild.id, ['starboard', 'threshold'], threshold);
        await message.reply({ embeds: [successEmbed(`Starboard threshold set to ${threshold} ${settings.starboard.emoji}`)] });
        break;

      case 'emoji':
        if (args.length < 2) {
          await message.reply({ embeds: [errorEmbed('Please provide an emoji: `?starboard emoji 🌟`')] });
          return;
        }

        const emoji = args[1];
        // Basic emoji validation
        if (emoji.length > 10) {
          await message.reply({ embeds: [errorEmbed('Please provide a valid emoji.')] });
          return;
        }

        patchGuildSettings(message.guild.id, ['starboard', 'emoji'], emoji);
        await message.reply({ embeds: [successEmbed(`Starboard emoji set to ${emoji}`)] });
        break;

      case 'nsfw':
        const ignoreNsfw = args[1]?.toLowerCase() !== 'false';
        patchGuildSettings(message.guild.id, ['starboard', 'ignoreNsfw'], ignoreNsfw);
        await message.reply({ 
          embeds: [successEmbed(`Starboard will ${ignoreNsfw ? 'ignore' : 'include'} NSFW channels.`)] 
        });
        break;

      default:
        await message.reply({ 
          embeds: [errorEmbed('Invalid subcommand. Use: enable, disable, channel, threshold, emoji, or nsfw')] 
        });
    }
  },
};

export default command;