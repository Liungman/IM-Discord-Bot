import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType } from 'discord.js';
import { defaultEmbed } from '../../lib/embeds.js';

const threadLockCommand: PrefixCommand = {
  name: 'thread lock',
  description: 'Lock the current thread to prevent new messages.',
  usage: '?thread lock [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageThreads,
  async execute(message, args) {
    if (!message.guild || !message.channel) return;
    
    // Check if we're in a thread
    if (![ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(message.channel.type)) {
      await message.reply('This command can only be used in threads.');
      return;
    }
    
    const thread = message.channel as any; // Thread channel
    const reason = args.join(' ') || 'No reason provided';
    
    try {
      // Lock the thread
      await thread.setLocked(true, `Locked by ${message.author.tag}: ${reason}`);
      
      const lockEmbed = defaultEmbed(message.guild)
        .setTitle('🔒 Thread Locked')
        .setDescription(`This thread has been locked by ${message.author.tag}`)
        .addFields(
          { name: 'Thread', value: thread.name },
          { name: 'Reason', value: reason }
        )
        .setColor(0xff4500)
        .setTimestamp();
      
      await message.reply({ embeds: [lockEmbed] });
      
    } catch (error) {
      console.error('Thread lock error:', error);
      await message.reply('Failed to lock thread. Make sure I have the Manage Threads permission.');
    }
  },
};

const threadUnlockCommand: PrefixCommand = {
  name: 'thread unlock',
  description: 'Unlock the current thread to allow new messages.',
  usage: '?thread unlock [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageThreads,
  async execute(message, args) {
    if (!message.guild || !message.channel) return;
    
    // Check if we're in a thread
    if (![ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(message.channel.type)) {
      await message.reply('This command can only be used in threads.');
      return;
    }
    
    const thread = message.channel as any; // Thread channel
    const reason = args.join(' ') || 'No reason provided';
    
    try {
      // Unlock the thread
      await thread.setLocked(false, `Unlocked by ${message.author.tag}: ${reason}`);
      
      const unlockEmbed = defaultEmbed(message.guild)
        .setTitle('🔓 Thread Unlocked')
        .setDescription(`This thread has been unlocked by ${message.author.tag}`)
        .addFields(
          { name: 'Thread', value: thread.name },
          { name: 'Reason', value: reason }
        )
        .setColor(0x00ff00)
        .setTimestamp();
      
      await message.reply({ embeds: [unlockEmbed] });
      
    } catch (error) {
      console.error('Thread unlock error:', error);
      await message.reply('Failed to unlock thread. Make sure I have the Manage Threads permission.');
    }
  },
};

export const commands: PrefixCommand[] = [threadLockCommand, threadUnlockCommand];