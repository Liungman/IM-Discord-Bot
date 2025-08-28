import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { emojiCdnUrl, parseEmoji } from '../../lib/emoji.js';

const command: PrefixCommand = {
  name: 'addemote',
  description: 'Add a custom emoji to this server. Usage: ?addemote <emoji> [name]',
  usage: '?addemote <custom_emoji> [name]',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageGuildExpressions,
  async execute(message, args) {
    if (!message.guild) return;
    const input = args[0];
    if (!input) return void message.reply('Provide a custom emoji like <:name:id> or <a:name:id>.');
    const parsed = parseEmoji(input);
    if (!parsed || 'unicode' in parsed) return void message.reply('Only custom emojis are supported for adding.');

    const name = args[1] || parsed.name || 'emoji';
    const url = emojiCdnUrl(parsed.id, parsed.animated);
    try {
      const created = await message.guild.emojis.create({ attachment: url, name });
      await message.reply(`Added :${created.name}: (${created})`);
    } catch {
      await message.reply('Failed to add emoji. Ensure I have Manage Expressions and the image is valid.');
    }
  },
};

export default command;