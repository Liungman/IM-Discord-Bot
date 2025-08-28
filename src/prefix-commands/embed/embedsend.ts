import type { PrefixCommand } from '../../types/prefixCommand.js';
import { getEmbed } from '../../storage/embeds.js';

const command: PrefixCommand = {
  name: 'embedsend',
  description: 'Send a stored embed by name.',
  usage: '?embedsend <name>',
  category: 'embed',
  guildOnly: true,
  async execute(message, args) {
    const name = (args[0] || '').toLowerCase();
    if (!name) return void message.reply('Usage: ?embedsend <name>');
    const e = getEmbed(message.guild!.id, name);
    if (!e) return void message.reply('No embed stored with that name.');
    await message.channel.send({ embeds: [e] });
  },
};

export default command;