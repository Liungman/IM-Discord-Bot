import type { PrefixCommand } from '../../types/prefixCommand.js';
import { listEmbeds } from '../../storage/embeds.js';

const command: PrefixCommand = {
  name: 'embedlist',
  description: 'List stored embed names.',
  usage: '?embedlist',
  category: 'embed',
  guildOnly: true,
  async execute(message) {
    const names = listEmbeds(message.guild!.id);
    if (!names.length) return void message.reply('No embeds stored.');
    await message.reply('Stored embeds: ' + names.join(', '));
  },
};

export default command;