import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'ping',
  description: 'Latency check.',
  usage: '?ping',
  category: 'utility',
  async execute(message) {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const api = message.client.ws.ping;
    await sent.edit(`Pong! Latency: ${latency}ms | API: ${api}ms`);
  },
};
export default command;