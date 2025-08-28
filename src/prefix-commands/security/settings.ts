import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, inlineCode } from 'discord.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';

const command: PrefixCommand = {
  name: 'settings',
  description: 'Show or set server settings. Examples: ?settings show | ?settings set autoDeleteMs 10000 | ?settings set antiNuke.enabled false',
  usage: '?settings show | ?settings set <path> <value>',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageGuild,
  async execute(message, args) {
    if (!message.guild) return;
    const sub = (args[0] || '').toLowerCase();
    if (sub !== 'set') {
      const s = getGuildSettings(message.guild.id);
      return void message.reply('```json\n' + JSON.stringify(s, null, 2).slice(0, 1900) + '\n```');
    }
    const path = (args[1] || '').split('.').filter(Boolean);
    const raw = args.slice(2).join(' ');
    if (!path.length || !raw) return void message.reply('Usage: ?settings set <path> <value>');
    let value: any = raw;
    if (raw === 'true' || raw === 'false') value = raw === 'true';
    else if (!Number.isNaN(Number(raw))) value = Number(raw);
    patchGuildSettings(message.guild.id, path, value);
    await message.reply(`Updated ${inlineCode(path.join('.'))} to ${inlineCode(String(value))}.`);
  },
};

export default command;