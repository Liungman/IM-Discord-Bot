import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, inlineCode } from 'discord.js';

const command: PrefixCommand = {
  name: 'invites',
  description: 'List active server invites',
  usage: '?invites',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageGuild,
  async execute(message) {
    if (!message.guild) return;
    try {
      const invites = await message.guild.invites.fetch();
      if (!invites.size) return void message.reply('No active invites found.');
      const lines = invites
        .map((i) => `• ${inlineCode(i.code)} — uses: ${i.uses ?? 0}${i.inviter ? ` — by ${i.inviter.tag}` : ''}`)
        .slice(0, 25);
      await message.reply(lines.join('\n'));
    } catch {
      await message.reply('Failed to fetch invites. I might lack Manage Guild permission.');
    }
  },
};

export default command;