import type { PrefixCommand } from '../../types/prefixCommand.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { PlayerManager } from '../../lib/PlayerManager.js';

const queueCommand: PrefixCommand = {
  name: 'queue',
  description: 'Manage the music queue - show, remove, move, shuffle, or clear songs.',
  usage: '?queue [remove <position>] [move <from> <to>] [shuffle] [clear]',
  category: 'music',
  aliases: ['q'],
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const player = PlayerManager.getPlayer(message.guild);
    const subCommand = args[0]?.toLowerCase();

    // Handle subcommands
    switch (subCommand) {
      case 'remove':
        await handleQueueRemove(message, args, player);
        return;
      case 'move':
        await handleQueueMove(message, args, player);
        return;
      case 'shuffle':
        await handleQueueShuffle(message, player);
        return;
      case 'clear':
      case 'empty':
        await handleQueueClear(message, player);
        return;
      default:
        // Show queue
        await handleQueueShow(message, player);
        return;
    }
  },
};

async function handleQueueShow(message: any, player: any) {
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
      .map((track: any, index: number) => `\`${index + 1}.\` **${track.title}** - <@${track.requestedBy}>`)
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
}

async function handleQueueRemove(message: any, args: string[], player: any) {
  if (args.length < 2) {
    await message.reply({ embeds: [errorEmbed('Please specify a position: `?queue remove <position>`')] });
    return;
  }

  const position = parseInt(args[1]) - 1; // Convert to 0-based index
  if (isNaN(position) || position < 0) {
    await message.reply({ embeds: [errorEmbed('Please provide a valid position number!')] });
    return;
  }

  const removed = player.removeFromQueue(position);

  if (!removed) {
    await message.reply({ embeds: [errorEmbed('Invalid queue position!')] });
    return;
  }

  await message.reply({ embeds: [successEmbed(`Removed from queue: **${removed.title}**`)] });
}

async function handleQueueMove(message: any, args: string[], player: any) {
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

  const success = player.moveInQueue(fromPos, toPos);

  if (!success) {
    await message.reply({ embeds: [errorEmbed('Invalid queue positions!')] });
    return;
  }

  await message.reply({ embeds: [successEmbed(`Moved song from position ${fromPos + 1} to ${toPos + 1}`)] });
}

async function handleQueueShuffle(message: any, player: any) {
  if (player.queue.length === 0) {
    await message.reply({ embeds: [errorEmbed('The queue is empty!')] });
    return;
  }

  player.shuffleQueue();
  await message.reply({ embeds: [successEmbed(`Shuffled ${player.queue.length} songs in the queue!`)] });
}

async function handleQueueClear(message: any, player: any) {
  if (player.queue.length === 0) {
    await message.reply({ embeds: [errorEmbed('The queue is already empty!')] });
    return;
  }

  const count = player.queue.length;
  player.clearQueue();
  await message.reply({ embeds: [successEmbed(`Cleared ${count} songs from the queue!`)] });
}

// Export as a single command now, reducing duplicates in help
export default queueCommand;