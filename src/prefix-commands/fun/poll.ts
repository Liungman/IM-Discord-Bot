import type { PrefixCommand } from '../../types/prefixCommand.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import { defaultEmbed, errorEmbed } from '../../lib/embeds.js';

interface PollData {
  question: string;
  options: string[];
  votes: Map<string, number>; // userId -> optionIndex
  messageId: string;
  channelId: string;
  endTime: number;
}

// Simple in-memory storage for active polls
const activePolls = new Map<string, PollData>();

const command: PrefixCommand = {
  name: 'poll',
  description: 'Create interactive polls with buttons.',
  usage: '?poll <duration> <question> | <option1> | <option2> [| <option3> ...]',
  category: 'fun',
  aliases: ['vote'],
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild || args.length < 3) {
      await message.reply({ 
        embeds: [errorEmbed('Usage: `?poll <duration> <question> | <option1> | <option2> [| <option3> ...]`\nExample: `?poll 5m What\'s your favorite color? | Red | Blue | Green`')] 
      });
      return;
    }

    // Parse duration
    const durationStr = args[0];
    const durationMatch = durationStr.match(/^(\d+)([smhd])$/);
    if (!durationMatch) {
      await message.reply({ 
        embeds: [errorEmbed('Invalid duration format. Use: 30s, 5m, 2h, or 1d')] 
      });
      return;
    }

    const [, amount, unit] = durationMatch;
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const duration = parseInt(amount) * multipliers[unit as keyof typeof multipliers];

    if (duration < 10000 || duration > 86400000 * 7) { // 10s to 7 days
      await message.reply({ 
        embeds: [errorEmbed('Duration must be between 10 seconds and 7 days.')] 
      });
      return;
    }

    // Parse question and options
    const pollText = args.slice(1).join(' ');
    const parts = pollText.split('|').map(part => part.trim());
    
    if (parts.length < 3) {
      await message.reply({ 
        embeds: [errorEmbed('Please provide a question and at least 2 options separated by |')] 
      });
      return;
    }

    const question = parts[0];
    const options = parts.slice(1);

    if (options.length > 10) {
      await message.reply({ 
        embeds: [errorEmbed('Maximum 10 poll options allowed.')] 
      });
      return;
    }

    // Create poll embed
    const pollEmbed = defaultEmbed(message.guild)
      .setTitle('📊 ' + question)
      .setDescription(options.map((opt, i) => `${i + 1}️⃣ ${opt}`).join('\n'))
      .addFields({ name: 'Duration', value: formatDuration(duration), inline: true })
      .setFooter({ text: `Poll by ${message.author.tag} • Click buttons to vote` })
      .setTimestamp();

    // Create buttons for each option
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < options.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (let j = i; j < Math.min(i + 5, options.length); j++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_${j}`)
            .setLabel(`${j + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(`${j + 1}️⃣`)
        );
      }
      rows.push(row);
    }

    const pollMessage = await message.reply({ 
      embeds: [pollEmbed], 
      components: rows 
    });

    // Store poll data
    const pollData: PollData = {
      question,
      options,
      votes: new Map(),
      messageId: pollMessage.id,
      channelId: message.channel.id,
      endTime: Date.now() + duration,
    };
    activePolls.set(pollMessage.id, pollData);

    // Set up button collector
    const collector = pollMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: duration,
    });

    collector.on('collect', async (interaction) => {
      if (!interaction.isButton()) return;

      const optionIndex = parseInt(interaction.customId.split('_')[1]);
      const userId = interaction.user.id;

      // Update vote
      pollData.votes.set(userId, optionIndex);

      // Update embed with current results
      const results = calculateResults(pollData);
      const updatedEmbed = EmbedBuilder.from(pollEmbed.data)
        .setDescription(
          options.map((opt, i) => {
            const count = results[i] || 0;
            const percentage = pollData.votes.size > 0 ? Math.round((count / pollData.votes.size) * 100) : 0;
            const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
            return `${i + 1}️⃣ ${opt}\n${bar} ${count} votes (${percentage}%)`;
          }).join('\n\n')
        )
        .addFields(
          { name: 'Total Votes', value: pollData.votes.size.toString(), inline: true },
          { name: 'Time Remaining', value: formatDuration(pollData.endTime - Date.now()), inline: true }
        );

      await interaction.update({ embeds: [updatedEmbed] });
    });

    collector.on('end', async () => {
      // Final results
      const results = calculateResults(pollData);
      const winner = results.indexOf(Math.max(...results));
      
      const finalEmbed = EmbedBuilder.from(pollEmbed.data)
        .setTitle('📊 Poll Ended: ' + question)
        .setDescription(
          options.map((opt, i) => {
            const count = results[i] || 0;
            const percentage = pollData.votes.size > 0 ? Math.round((count / pollData.votes.size) * 100) : 0;
            const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
            const winnerEmoji = i === winner && count > 0 ? ' 🏆' : '';
            return `${i + 1}️⃣ ${opt}${winnerEmoji}\n${bar} ${count} votes (${percentage}%)`;
          }).join('\n\n')
        )
        .setColor('#FFD700')
        .addFields({ name: 'Total Votes', value: pollData.votes.size.toString() })
        .setFooter({ text: 'Poll ended' });

      // Disable all buttons
      const disabledRows = rows.map(row => {
        const newRow = new ActionRowBuilder<ButtonBuilder>();
        row.components.forEach(component => {
          const newButton = ButtonBuilder.from(component);
          newButton.setDisabled(true);
          newRow.addComponents(newButton);
        });
        return newRow;
      });

      try {
        await pollMessage.edit({ 
          embeds: [finalEmbed], 
          components: disabledRows 
        });
      } catch (error) {
        console.error('Error updating poll message:', error);
      }

      // Clean up
      activePolls.delete(pollMessage.id);
    });
  },
};

function calculateResults(poll: PollData): number[] {
  const results = new Array(poll.options.length).fill(0);
  for (const optionIndex of poll.votes.values()) {
    if (optionIndex >= 0 && optionIndex < results.length) {
      results[optionIndex]++;
    }
  }
  return results;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Ended';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default command;