import type { PrefixCommand } from '../../types/prefixCommand.js';
import { userMention, time, TimestampStyles } from 'discord.js';
import { getWarns } from '../../storage/warns.js';

const command: PrefixCommand = {
  name: 'warnings',
  description: 'List warnings for a member.',
  usage: '?warnings [@user]',
  category: 'moderation',
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;
    const user = message.mentions.users.first() || message.author;
    const ws = getWarns(message.guild.id, user.id);
    if (!ws.length) return void message.reply(`${userMention(user.id)} has no warnings.`);
    const lines = ws
      .slice(-10)
      .map((w, i) => `${i + 1}. ${w.reason} — by ${w.by} (${time(Math.floor(w.at / 1000), TimestampStyles.RelativeTime)})`);
    await message.reply(lines.join('\n'));
  },
};

export default command;