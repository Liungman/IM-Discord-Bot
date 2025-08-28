import type { EventModule } from '../types/event.js';
import { setSnipe } from '../state/snipe.js';

const mod: EventModule = {
  name: 'messageDelete',
  async execute(_client, msg) {
    if (!msg || !msg.channel) return;
    const content = msg.content ?? '';
    const attachments = msg.attachments?.map((a: any) => a.url) ?? [];
    const authorTag = msg.author ? `${msg.author.tag}` : 'Unknown#0000';
    setSnipe(msg.channel.id, {
      content,
      attachments,
      authorTag,
      createdTimestamp: msg.createdTimestamp ?? Date.now(),
    });
  },
};

export default mod;