import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';
import { DefaultSettings } from '../../config/defaults.js';
import { defaultEmbed } from '../../lib/embeds.js';

const prefixCommand: PrefixCommand = {
  name: 'prefix',
  description: 'Show the current server prefix.',
  usage: '?prefix',
  category: 'utility',
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;
    const settings = getGuildSettings(message.guild.id);
    const currentPrefix = settings.prefix || DefaultSettings.prefix;
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Server Prefix')
      .setDescription(`Current prefix: **${currentPrefix}**`)
      .addFields(
        { name: 'Change Prefix', value: `Use \`${currentPrefix}prefix set <symbol>\` to change it` },
        { name: 'Reset Prefix', value: `Use \`${currentPrefix}prefix remove\` to reset to default` }
      );
    
    await message.reply({ embeds: [embed] });
  },
};

const prefixSetCommand: PrefixCommand = {
  name: 'prefix set',
  description: 'Set a new prefix for this server. (Administrator only)',
  usage: '?prefix set <symbol>',
  category: 'utility',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.Administrator,
  async execute(message, args) {
    if (!message.guild) return;
    
    const newPrefix = args[0];
    if (!newPrefix) {
      const settings = getGuildSettings(message.guild.id);
      const currentPrefix = settings.prefix || DefaultSettings.prefix;
      await message.reply(`Please provide a new prefix. Usage: \`${currentPrefix}prefix set <symbol>\``);
      return;
    }
    
    if (newPrefix.length > 5) {
      await message.reply('Prefix must be 5 characters or less.');
      return;
    }
    
    patchGuildSettings(message.guild.id, ['prefix'], newPrefix);
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Prefix Updated')
      .setDescription(`Server prefix changed to: **${newPrefix}**`)
      .addFields({ name: 'Example', value: `Use \`${newPrefix}help\` to see all commands` });
    
    await message.reply({ embeds: [embed] });
  },
};

const prefixRemoveCommand: PrefixCommand = {
  name: 'prefix remove',
  description: 'Reset the server prefix to default (?). (Administrator only)',
  usage: '?prefix remove',
  category: 'utility',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.Administrator,
  async execute(message) {
    if (!message.guild) return;
    
    patchGuildSettings(message.guild.id, ['prefix'], DefaultSettings.prefix);
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Prefix Reset')
      .setDescription(`Server prefix reset to default: **${DefaultSettings.prefix}**`)
      .addFields({ name: 'Example', value: `Use \`${DefaultSettings.prefix}help\` to see all commands` });
    
    await message.reply({ embeds: [embed] });
  },
};

// Export as array for multi-command support
export const commands: PrefixCommand[] = [prefixCommand, prefixSetCommand, prefixRemoveCommand];