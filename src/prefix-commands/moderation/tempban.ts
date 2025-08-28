import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { defaultEmbed, errorEmbed } from '../../lib/embeds.js';
import { addTempBan } from '../../storage/tempbans.js';

// Helper function to parse duration
function parseDuration(duration: string): number | null {
  const regex = /^(\d+)([smhd])$/i;
  const match = duration.match(regex);
  
  if (!match) return null;
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };
  
  return value * multipliers[unit as keyof typeof multipliers];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

const tempbanCommand: PrefixCommand = {
  name: 'tempban',
  description: 'Temporarily ban a user for a specified duration.',
  usage: '?tempban @user <duration> [reason] (duration: 1s, 5m, 2h, 7d)',
  category: 'moderation',
  aliases: ['tb'],
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.BanMembers,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user to tempban: `?tempban @user <duration> [reason]`');
      return;
    }
    
    const durationStr = args[1];
    if (!durationStr) {
      await message.reply('Please specify a duration: `?tempban @user <duration> [reason]`\nExamples: 1h, 30m, 7d');
      return;
    }
    
    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      await message.reply('Invalid duration format. Use: 1s, 5m, 2h, 7d (seconds, minutes, hours, days)');
      return;
    }
    
    // Limit maximum duration to 30 days
    const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (durationMs > maxDuration) {
      await message.reply('Maximum tempban duration is 30 days.');
      return;
    }
    
    const reason = args.slice(2).join(' ') || 'No reason provided';
    
    // Check if target is bannable
    const targetMember = await message.guild.members.fetch(target.id).catch(() => null);
    if (targetMember && !targetMember.bannable) {
      await message.reply({ embeds: [errorEmbed('I cannot ban this user. They may have higher permissions than me.')] });
      return;
    }
    
    // Check hierarchy
    if (targetMember && message.member && targetMember.roles.highest.position >= message.member.roles.highest.position) {
      await message.reply({ embeds: [errorEmbed('You cannot tempban this user due to role hierarchy.')] });
      return;
    }
    
    try {
      // Ban the user
      await message.guild.members.ban(target, {
        deleteMessageDays: 1,
        reason: `Tempban by ${message.author.tag}: ${reason}`
      });
      
      // Add to tempban storage
      addTempBan(target.id, message.guild.id, durationMs, reason);
      
      const expiry = new Date(Date.now() + durationMs);
      const embed = defaultEmbed(message.guild)
        .setTitle('Temporary Ban Applied')
        .setDescription(`Successfully tempbanned ${target.tag}`)
        .addFields(
          { name: 'Target', value: `${target.tag} (${target.id})` },
          { name: 'Moderator', value: `${message.author.tag}` },
          { name: 'Duration', value: formatDuration(durationMs) },
          { name: 'Expires', value: `<t:${Math.floor(expiry.getTime() / 1000)}:F>` },
          { name: 'Reason', value: reason }
        )
        .setColor(0xff4444);
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      await message.reply({ embeds: [errorEmbed('Failed to tempban user. I may lack permissions or the user is not bannable.')] });
    }
  },
};

export default tempbanCommand;