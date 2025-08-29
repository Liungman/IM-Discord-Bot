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

    // Auto Temp VC creation: Check if user joined a "Create VC" channel
    if (newChannelId && newState.channel && newState.member) {
      const channel = newState.channel;
      
      // Check if channel name is "Create VC" (case-insensitive)
      if (channel.name.toLowerCase() === 'create vc') {
        const guild = newState.guild;
        const member = newState.member;
        
        // Create a temporary VC for this user
        const tempVC = await TempVoiceManager.createTempChannel(
          guild,
          member.id,
          `${member.displayName || member.user.username}'s Channel`
        );
        
        if (tempVC) {
          // Move the user to the new temp channel
          try {
            await member.voice.setChannel(tempVC);
          } catch (error) {
            console.error('Failed to move user to temp channel:', error);
          }
        }
      }
    }
  },
};

export default mod;