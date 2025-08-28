import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';

const command: PrefixCommand = {
  name: 'gradient',
  description: 'Configure embed gradient settings for the server.',
  usage: '?gradient <position|colors> [values...]',
  category: 'utility',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageGuild,
  async execute(message, args) {
    if (!message.guild) return;

    if (args.length === 0) {
      // Show current settings
      const settings = getGuildSettings(message.guild.id);
      const embed = defaultEmbed(message.guild)
        .setTitle('Gradient Settings')
        .addFields(
          { name: 'Position', value: settings.gradient.position },
          { name: 'Start Color', value: settings.gradient.startColor, inline: true },
          { name: 'End Color', value: settings.gradient.endColor, inline: true }
        )
        .setFooter({ text: 'Use ?gradient position <top|bottom|thumbnail-bar|none> or ?gradient colors <start> <end>' });
      
      await message.reply({ embeds: [embed] });
      return;
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'position') {
      if (args.length < 2) {
        await message.reply({ embeds: [errorEmbed('Please specify a position: top, bottom, thumbnail-bar, or none')] });
        return;
      }

      const position = args[1].toLowerCase();
      if (!['top', 'bottom', 'thumbnail-bar', 'none'].includes(position)) {
        await message.reply({ embeds: [errorEmbed('Invalid position. Use: top, bottom, thumbnail-bar, or none')] });
        return;
      }

      patchGuildSettings(message.guild.id, ['gradient', 'position'], position);
      await message.reply({ embeds: [successEmbed(`Gradient position set to ${position}`)] });
    } else if (subcommand === 'colors') {
      if (args.length < 3) {
        await message.reply({ embeds: [errorEmbed('Please specify start and end colors: ?gradient colors #1e40af #000000')] });
        return;
      }

      const startColor = args[1];
      const endColor = args[2];

      // Basic color validation (hex format)
      const colorRegex = /^#[0-9A-F]{6}$/i;
      if (!colorRegex.test(startColor) || !colorRegex.test(endColor)) {
        await message.reply({ embeds: [errorEmbed('Colors must be in hex format (e.g., #1e40af)')] });
        return;
      }

      patchGuildSettings(message.guild.id, ['gradient', 'startColor'], startColor);
      patchGuildSettings(message.guild.id, ['gradient', 'endColor'], endColor);
      await message.reply({ embeds: [successEmbed(`Gradient colors updated: ${startColor} → ${endColor}`)] });
    } else {
      await message.reply({ embeds: [errorEmbed('Invalid subcommand. Use: position or colors')] });
    }
  },
};

export default command;