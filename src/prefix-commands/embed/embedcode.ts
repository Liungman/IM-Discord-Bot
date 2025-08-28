import type { PrefixCommand } from '../../types/prefixCommand.js';

function parseMessageLink(link: string) {
  const m = /https?:\/\/(?:canary\.|ptb\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/.exec(link);
  if (!m) return null;
  return { guildId: m[1], channelId: m[2], messageId: m[3] };
}

const command: PrefixCommand = {
  name: 'embedcode',
  description: 'Copy JSON for an existing embed from a message link.',
  usage: '?embedcode <message link>',
  category: 'embed',
  guildOnly: true,
  async execute(message, args) {
    const link = args[0];
    if (!link) return void message.reply('Provide a message link.');
    const ids = parseMessageLink(link);
    if (!ids) return void message.reply('Invalid message link.');
    const ch = await message.client.channels.fetch(ids.channelId).catch(() => null) as any;
    if (!ch?.isTextBased()) return void message.reply('Cannot fetch that message.');
    const msg = await ch.messages.fetch(ids.messageId).catch(() => null);
    const emb = msg?.embeds?.[0];
    if (!emb) return void message.reply('No embeds found in that message.');
    const json = emb.toJSON();
    await message.reply('```json\n' + JSON.stringify(json, null, 2).slice(0, 1900) + '\n```');
  },
};

export default command;