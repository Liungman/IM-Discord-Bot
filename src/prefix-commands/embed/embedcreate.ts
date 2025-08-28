import type { PrefixCommand } from '../../types/prefixCommand.js';
import { saveEmbed } from '../../storage/embeds.js';

const command: PrefixCommand = {
  name: 'embedcreate',
  description: 'Create or overwrite a stored embed from JSON.',
  usage: '?embedcreate <name> <json>',
  category: 'embed',
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;
    const name = (args[0] || '').toLowerCase();
    const jsonStr = args.slice(1).join(' ');
    if (!name || !jsonStr) return void message.reply('Usage: ?embedcreate <name> <json>');
    try {
      const parsed = JSON.parse(jsonStr);
      saveEmbed(message.guild.id, name, parsed);
      await message.reply(`Embed "${name}" saved.`);
    } catch {
      await message.reply('Invalid JSON. Make sure to wrap your JSON in quotes.');
    }
  },
};

export default command;