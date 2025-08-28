import type { PrefixCommand } from '../../types/prefixCommand.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { PlayerManager } from '../../lib/PlayerManager.js';

const queueCommand: PrefixCommand = {
  name: 'queue',
  description: 'Display the current music queue.',
  usage: '?queue',
  category: 'music',
  aliases: ['q'],
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const player = PlayerManager.getPlayer(message.guild);

    if (!player.currentTrack && player.queue.length === 0) {
      await message.reply({ embeds: [errorEmbed('The queue is empty!')] });
      return;
    }

    const embed = defaultEmbed(message.guild).setTitle('🎵 Music Queue');

    if (player.currentTrack) {
      embed.addFields({
        name: '🎵 Now Playing',
        value: `**${player.currentTrack.title}**\nRequested by: <@${player.currentTrack.requestedBy}>`,
      });
    }

    if (player.queue.length > 0) {
      const queueList = player.queue
        .slice(0, 10) // Show first 10 items
        .map((track, index) => `\`${index + 1}.\` **${track.title}** - <@${track.requestedBy}>`)
        .join('\n');

      embed.addFields({
        name: `📝 Up Next (${player.queue.length} song${player.queue.length !== 1 ? 's' : ''})`,
        value: queueList + (player.queue.length > 10 ? `\n*...and ${player.queue.length - 10} more*` : ''),
      });
    }

    // Add repeat mode and volume info
    const status = [];
    if (player.repeatMode !== 'off') {
      status.push(`🔁 Repeat: ${player.repeatMode}`);
    }
    status.push(`🔊 Volume: ${player.volume}%`);
    
    if (status.length > 0) {
      embed.setFooter({ text: status.join(' | ') });
    }

    await message.reply({ embeds: [embed] });
  },
};

const queueRemoveCommand: PrefixCommand = {
  name: 'queue remove',
  description: 'Remove a song from the queue by position.',
  usage: '?queue remove <position>',
  category: 'music',
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    if (args.length < 2) {
      await message.reply({ embeds: [errorEmbed('Please specify a position: `?queue remove <position>`')] });
      return;
    }

    const position = parseInt(args[1]) - 1; // Convert to 0-based index
    if (isNaN(position) || position < 0) {
      await message.reply({ embeds: [errorEmbed('Please provide a valid position number!')] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild);
    const removed = player.removeFromQueue(position);

    if (!removed) {
      await message.reply({ embeds: [errorEmbed('Invalid queue position!')] });
      return;
    }

    await message.reply({ embeds: [successEmbed(`Removed from queue: **${removed.title}**`)] });
  },
};

const queueMoveCommand: PrefixCommand = {
  name: 'queue move',
  description: 'Move a song to a different position in the queue.',
  usage: '?queue move <from> <to>',
  category: 'music',
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    if (args.length < 3) {
      await message.reply({ embeds: [errorEmbed('Please specify positions: `?queue move <from> <to>`')] });
      return;
    }

    const fromPos = parseInt(args[1]) - 1; // Convert to 0-based index
    const toPos = parseInt(args[2]) - 1;

    if (isNaN(fromPos) || isNaN(toPos) || fromPos < 0 || toPos < 0) {
      await message.reply({ embeds: [errorEmbed('Please provide valid position numbers!')] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild);
    const success = player.moveInQueue(fromPos, toPos);

    if (!success) {
      await message.reply({ embeds: [errorEmbed('Invalid queue positions!')] });
      return;
    }

    await message.reply({ embeds: [successEmbed(`Moved song from position ${fromPos + 1} to ${toPos + 1}`)] });
  },
};

const queueShuffleCommand: PrefixCommand = {
  name: 'queue shuffle',
  description: 'Shuffle the current queue.',
  usage: '?queue shuffle',
  category: 'music',
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const player = PlayerManager.getPlayer(message.guild);

    if (player.queue.length === 0) {
      await message.reply({ embeds: [errorEmbed('The queue is empty!')] });
      return;
    }

    player.shuffleQueue();
    await message.reply({ embeds: [successEmbed(`Shuffled ${player.queue.length} songs in the queue!`)] });
  },
};

const queueEmptyCommand: PrefixCommand = {
  name: 'queue empty',
  description: 'Clear all songs from the queue.',
  usage: '?queue empty',
  category: 'music',
  aliases: ['queue clear'],
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const player = PlayerManager.getPlayer(message.guild);

    if (player.queue.length === 0) {
      await message.reply({ embeds: [errorEmbed('The queue is already empty!')] });
      return;
    }

    const count = player.queue.length;
    player.clearQueue();
    await message.reply({ embeds: [successEmbed(`Cleared ${count} songs from the queue!`)] });
  },
};

// Export all queue-related commands as an array
export default [queueCommand, queueRemoveCommand, queueMoveCommand, queueShuffleCommand, queueEmptyCommand];