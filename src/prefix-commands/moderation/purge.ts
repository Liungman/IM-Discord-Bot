import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';

const command: PrefixCommand = {
  name: 'purge',
  description: 'Bulk delete recent messages (1-100). Usage: ?purge 25',
  usage: '?purge <count> [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message, args) {
    const count = parseInt(args[0] || '', 10);
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      await message.reply('Provide a number between 1 and 100, e.g. ?purge 20');
      return;
    }
    if (!message.channel?.isTextBased()) return;

    try {
      const res = await (message.channel as any).bulkDelete(count, true);
      await message.reply(`Deleted ${res.size} message(s).`).then((m) =>
        setTimeout(() => m.delete().catch(() => {}), 5000),
      );
    } catch {
      await message.reply('Failed to purge messages. I may lack permissions or messages are too old.');
    }
  },
};

export default command;