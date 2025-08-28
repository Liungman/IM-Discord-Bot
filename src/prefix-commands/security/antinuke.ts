import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';

const command: PrefixCommand = {
  name: 'antinuke',
  description: 'Enable/disable anti-nuke and view thresholds.',
  usage: '?antinuke [on|off|status]',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageGuild,
  async execute(message, args) {
    if (!message.guild) return;
    const sub = (args[0] || 'status').toLowerCase();
    const s = getGuildSettings(message.guild.id);
    if (sub === 'on') {
      patchGuildSettings(message.guild.id, ['antiNuke','enabled'], true);
      return void message.reply('Anti-nuke enabled.');
    }
    if (sub === 'off') {
      patchGuildSettings(message.guild.id, ['antiNuke','enabled'], false);
      return void message.reply('Anti-nuke disabled.');
    }
    return void message.reply('```json\n' + JSON.stringify(s.antiNuke, null, 2).slice(0, 1900) + '\n```');
  },
};

export default command;