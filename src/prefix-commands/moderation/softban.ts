import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { defaultEmbed, errorEmbed } from '../../lib/embeds.js';

const softbanCommand: PrefixCommand = {
  name: 'softban',
  description: 'Ban and immediately unban a user to delete their recent messages.',
  usage: '?softban @user [reason]',
  category: 'moderation',
  aliases: ['sb'],
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.BanMembers,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user to softban: `?softban @user [reason]`');
      return;
    }
    
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    // Check if target is bannable
    const targetMember = await message.guild.members.fetch(target.id).catch(() => null);
    if (targetMember && !targetMember.bannable) {
      await message.reply({ embeds: [errorEmbed('I cannot ban this user. They may have higher permissions than me.')] });
      return;
    }
    
    // Check hierarchy
    if (targetMember && message.member && targetMember.roles.highest.position >= message.member.roles.highest.position) {
      await message.reply({ embeds: [errorEmbed('You cannot softban this user due to role hierarchy.')] });
      return;
    }
    
    try {
      // Ban the user (delete 1 day of messages)
      await message.guild.members.ban(target, {
        deleteMessageDays: 1,
        reason: `Softban by ${message.author.tag}: ${reason}`
      });
      
      // Immediately unban
      await message.guild.members.unban(target, `Softban unban by ${message.author.tag}`);
      
      const embed = defaultEmbed(message.guild)
        .setTitle('Softban Complete')
        .setDescription(`Successfully softbanned ${target.tag}`)
        .addFields(
          { name: 'Target', value: `${target.tag} (${target.id})` },
          { name: 'Moderator', value: `${message.author.tag}` },
          { name: 'Reason', value: reason },
          { name: 'Effect', value: 'User banned and unbanned, last 24 hours of messages deleted' }
        )
        .setColor(0xff8c00);
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      await message.reply({ embeds: [errorEmbed('Failed to softban user. I may lack permissions or the user is not bannable.')] });
    }
  },
};

export default softbanCommand;