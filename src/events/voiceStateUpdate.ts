import type { EventModule } from '../types/event.js';
import { TempVoiceManager } from '../lib/TempVoiceManager.js';

const mod: EventModule = {
  name: 'voiceStateUpdate',
  async execute(client, oldState, newState) {
    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    // Handle temp voice channel activity tracking
    TempVoiceManager.handleVoiceStateUpdate(oldChannelId, newChannelId);

    // Check if user left a temp channel and it's now empty
    if (oldChannelId && TempVoiceManager.isTempChannel(oldChannelId)) {
      const channel = oldState.channel;
      if (channel && channel.members.size === 0) {
        // Channel is empty, let the cleanup timer handle it
        TempVoiceManager.updateActivity(oldChannelId);
      }
    }
  },
};

export default mod;