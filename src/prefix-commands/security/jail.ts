import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { defaultEmbed, errorEmbed } from '../../lib/embeds.js';
import { addJailedUser, removeJailedUser, getAllJailedUsers } from '../../storage/jail.js';
import { getGuildSettings } from '../../storage/guildSettings.js';

// Helper function to parse duration (reused from tempban)
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

const jailCommand: PrefixCommand = {
  name: 'jail',
  description: 'Jail a user by removing their roles and adding a jail role.',
  usage: '?jail @user <duration> [reason] (duration: 1s, 5m, 2h, 7d, or "perm")',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageRoles,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user to jail: `?jail @user <duration> [reason]`');
      return;
    }
    
    const durationStr = args[1];
    if (!durationStr) {
      await message.reply('Please specify a duration: `?jail @user <duration> [reason]`\nExamples: 1h, 30m, 7d, perm');
      return;
    }
    
    let durationMs: number | undefined;
    if (durationStr.toLowerCase() !== 'perm') {
      const parsed = parseDuration(durationStr);
      if (!parsed) {
        await message.reply('Invalid duration format. Use: 1s, 5m, 2h, 7d (or "perm" for permanent)');
        return;
      }
      durationMs = parsed;
    }
    
    const reason = args.slice(2).join(' ') || 'No reason provided';
    
    const targetMember = await message.guild.members.fetch(target.id).catch(() => null);
    if (!targetMember) {
      await message.reply({ embeds: [errorEmbed('User not found in this server.')] });
      return;
    }
    
    // Check hierarchy
    if (message.member && targetMember.roles.highest.position >= message.member.roles.highest.position) {
      await message.reply({ embeds: [errorEmbed('You cannot jail this user due to role hierarchy.')] });
      return;
    }
    
    // Get jail role from settings (would need to be configured)
    const settings = getGuildSettings(message.guild.id);
    const jailRoleId = settings.lockdown?.lockRoleId; // Reuse lockdown role as jail role
    
    if (!jailRoleId) {
      await message.reply({ embeds: [errorEmbed('No jail role configured. Use lockdown settings to set a jail role.')] });
      return;
    }
    
    const jailRole = message.guild.roles.cache.get(jailRoleId);
    if (!jailRole) {
      await message.reply({ embeds: [errorEmbed('Configured jail role not found.')] });
      return;
    }
    
    try {
      // Store current roles
      const previousRoles = targetMember.roles.cache
        .filter(role => role.id !== message.guild!.id) // Exclude @everyone
        .map(role => role.id);
      
      // Remove all roles except @everyone
      await targetMember.roles.set([jailRole.id], `Jailed by ${message.author.tag}: ${reason}`);
      
      // Add to jail storage
      addJailedUser(target.id, message.guild.id, previousRoles, reason, durationMs);
      
      const embed = defaultEmbed(message.guild)
        .setTitle('User Jailed')
        .setDescription(`Successfully jailed ${target.tag}`)
        .addFields(
          { name: 'Target', value: `${target.tag} (${target.id})` },
          { name: 'Moderator', value: `${message.author.tag}` },
          { name: 'Duration', value: durationMs ? formatDuration(durationMs) : 'Permanent' },
          ...(durationMs ? [{ name: 'Expires', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:F>` }] : []),
          { name: 'Reason', value: reason }
        )
        .setColor(0x8b0000);
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      await message.reply({ embeds: [errorEmbed('Failed to jail user. I may lack permissions.')] });
    }
  },
};

const unjailCommand: PrefixCommand = {
  name: 'unjail',
  description: 'Unjail a user by restoring their previous roles.',
  usage: '?unjail @user',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageRoles,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user to unjail: `?unjail @user`');
      return;
    }
    
    const jailEntry = removeJailedUser(target.id, message.guild.id);
    if (!jailEntry) {
      await message.reply({ embeds: [errorEmbed('This user is not currently jailed.')] });
      return;
    }
    
    const targetMember = await message.guild.members.fetch(target.id).catch(() => null);
    if (!targetMember) {
      await message.reply({ embeds: [errorEmbed('User not found in this server.')] });
      return;
    }
    
    try {
      // Restore previous roles
      const rolesToRestore = jailEntry.previousRoles
        .map(roleId => message.guild!.roles.cache.get(roleId))
        .filter(role => role !== undefined) as any[];
      
      await targetMember.roles.set(rolesToRestore, `Unjailed by ${message.author.tag}`);
      
      const embed = defaultEmbed(message.guild)
        .setTitle('User Unjailed')
        .setDescription(`Successfully unjailed ${target.tag}`)
        .addFields(
          { name: 'Target', value: `${target.tag} (${target.id})` },
          { name: 'Moderator', value: `${message.author.tag}` },
          { name: 'Roles Restored', value: `${rolesToRestore.length} roles` }
        )
        .setColor(0x00ff00);
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      await message.reply({ embeds: [errorEmbed('Failed to unjail user. I may lack permissions.')] });
    }
  },
};

const jaillistCommand: PrefixCommand = {
  name: 'jaillist',
  description: 'List all currently jailed users.',
  usage: '?jaillist',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageRoles,
  async execute(message) {
    if (!message.guild) return;
    
    const jailedUsers = getAllJailedUsers(message.guild.id);
    
    if (jailedUsers.length === 0) {
      await message.reply({ embeds: [errorEmbed('No users are currently jailed.')] });
      return;
    }
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Jailed Users')
      .setDescription(`${jailedUsers.length} user(s) currently jailed`);
    
    const userList = await Promise.all(
      jailedUsers.slice(0, 10).map(async (entry) => { // Limit to 10 for embed space
        try {
          const user = await message.client.users.fetch(entry.userId);
          const expiry = entry.expiry ? `<t:${Math.floor(entry.expiry / 1000)}:R>` : 'Permanent';
          return `${user.tag} - Expires: ${expiry}`;
        } catch {
          return `Unknown User (${entry.userId}) - Expires: ${entry.expiry ? `<t:${Math.floor(entry.expiry / 1000)}:R>` : 'Permanent'}`;
        }
      })
    );
    
    embed.addFields({ name: 'Users', value: userList.join('\n') || 'None' });
    
    if (jailedUsers.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${jailedUsers.length} jailed users` });
    }
    
    await message.reply({ embeds: [embed] });
  },
};

export const commands: PrefixCommand[] = [jailCommand, unjailCommand, jaillistCommand];