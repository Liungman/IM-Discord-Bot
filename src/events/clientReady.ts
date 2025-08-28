import type { EventModule } from '../types/event.js';
import { ActivityType } from 'discord.js';

const mod: EventModule = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    const prefix = '?';
    function setPresence() {
      const guilds = client.guilds.cache.size;
      const ping = Math.round(client.ws.ping);
      client.user?.setPresence({
        activities: [{ name: `${prefix}help • ${guilds} servers • ${ping}ms`, type: ActivityType.Watching }],
        status: 'online',
      });
    }
    setPresence();
    setInterval(setPresence, 60_000);
  },
};

export default mod;