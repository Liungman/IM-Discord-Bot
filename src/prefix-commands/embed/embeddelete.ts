import type { PrefixCommand } from '../../types/prefixCommand.js';
import { deleteEmbed } from '../../storage/embeds.js';

const command: PrefixCommand = {
  name: 'embeddelete',
  description: 'Delete a stored embed by name.',
  usage: '?embeddelete <name>',
  category: 'embed',
  guildOnly: true,
  async execute(message, args) {
    const name = (args[0] || '').toLowerCase();
    if (!name) return void message.reply('Usage: ?embeddelete <name>');
    const ok = deleteEmbed(message.guild!.id, name);
    await message.reply(ok ? `Deleted "${name}".` : 'No embed with that name.');
  },
};

export default command;