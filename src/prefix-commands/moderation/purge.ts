import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, type TextChannel, type NewsChannel, type VoiceChannel, type ThreadChannel } from 'discord.js';
import { defaultEmbed } from '../../lib/embeds.js';

type BulkDeletableChannel = TextChannel | NewsChannel | VoiceChannel | ThreadChannel;

const purgeCommand: PrefixCommand = {
  name: 'purge',
  description: 'Bulk delete recent messages (1-100).',
  usage: '?purge <count> [reason]',
  category: 'moderation',
  aliases: ['p'],
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message, args) {
    const count = parseInt(args[0] || '', 10);
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      await message.reply('Provide a number between 1 and 100, e.g. ?purge 20');
      return;
    }
    if (!message.channel?.isTextBased()) return;

    try {
      const res = await (message.channel as BulkDeletableChannel).bulkDelete(count, true);
      const embed = defaultEmbed(message.guild!)
        .setTitle('Messages Purged')
        .setDescription(`Successfully deleted ${res.size} message(s).`)
        .setColor(0x00ff00);
      
      await message.reply({ embeds: [embed] });
    } catch {
      await message.reply('Failed to purge messages. I may lack permissions or messages are too old.');
    }
  },
};

const purgeAllCommand: PrefixCommand = {
  name: 'purge all',
  description: 'Delete ALL messages in the channel (in batches of 100, limited by Discord\'s 14-day rule).',
  usage: '?purge all',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message) {
    if (!message.channel?.isTextBased()) return;
    
    // Start purging immediately (no confirmation needed per requirements)
    const statusEmbed = defaultEmbed(message.guild!)
      .setTitle('Purge in Progress')
      .setDescription('Deleting all messages... This may take a while.')
      .setColor(0xffff00);
    
    const statusMsg = await message.reply({ embeds: [statusEmbed] });
    
    let totalDeleted = 0;
    let lastBatch = 100;
    
    try {
      while (lastBatch === 100) {
        const result = await (message.channel as BulkDeletableChannel).bulkDelete(100, true);
        lastBatch = result.size;
        totalDeleted += lastBatch;
        
        // Update status every few batches
        if (totalDeleted % 300 === 0) {
          const updateEmbed = defaultEmbed(message.guild!)
            .setTitle('Purge in Progress')
            .setDescription(`Deleted ${totalDeleted} messages so far...`)
            .setColor(0xffff00);
          
          await statusMsg.edit({ embeds: [updateEmbed] });
        }
        
        // Small delay to avoid rate limits
        if (lastBatch === 100) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successEmbed = defaultEmbed(message.guild!)
        .setTitle('Purge Complete')
        .setDescription(`Successfully deleted ${totalDeleted} message(s).`)
        .addFields({ name: 'Note', value: 'Messages older than 14 days cannot be bulk deleted by Discord\'s API.' })
        .setColor(0x00ff00);
      
      await statusMsg.edit({ embeds: [successEmbed] });
      
    } catch (error) {
      const errorEmbed = defaultEmbed(message.guild!)
        .setTitle('Purge Failed')
        .setDescription(`Deleted ${totalDeleted} messages before encountering an error.`)
        .addFields({ name: 'Error', value: 'Failed to delete messages. I may lack permissions or messages are too old.' })
        .setColor(0xff0000);
      
      await statusMsg.edit({ embeds: [errorEmbed] });
    }
  },
};

const purgeBetweenCommand: PrefixCommand = {
  name: 'purge between',
  description: 'Delete messages between two message IDs (inclusive).',
  usage: '?purge between <startMessageId> <endMessageId>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message, args) {
    const startId = args[0];
    const endId = args[1];
    
    if (!startId || !endId) {
      await message.reply('Usage: `purge between <startMessageId> <endMessageId>`\nYou can get message IDs by right-clicking messages with Developer Mode enabled.');
      return;
    }
    
    if (!message.channel?.isTextBased()) return;
    
    try {
      // Fetch messages between the IDs
      const messages = [];
      let lastId = endId;
      let shouldContinue = true;
      
      while (shouldContinue && messages.length < 1000) { // Safety limit
        const fetched = await message.channel.messages.fetch({ 
          limit: 100, 
          before: lastId 
        });
        
        if (fetched.size === 0) break;
        
        for (const [id, msg] of fetched) {
          if (id === startId) {
            messages.push(msg);
            shouldContinue = false;
            break;
          }
          messages.push(msg);
          if (id < startId) {
            shouldContinue = false;
            break;
          }
        }
        
        lastId = fetched.lastKey() || lastId;
      }
      
      // Include the end message if we haven't reached it
      if (shouldContinue) {
        try {
          const endMessage = await message.channel.messages.fetch(endId);
          messages.unshift(endMessage);
        } catch {
          // End message might not exist
        }
      }
      
      if (messages.length === 0) {
        await message.reply('No messages found between those IDs.');
        return;
      }
      
      // Delete in batches
      let totalDeleted = 0;
      const batches = [];
      
      for (let i = 0; i < messages.length; i += 100) {
        batches.push(messages.slice(i, i + 100));
      }
      
      const statusEmbed = defaultEmbed(message.guild!)
        .setTitle('Batch Delete in Progress')
        .setDescription(`Found ${messages.length} messages. Deleting in ${batches.length} batch(es)...`)
        .setColor(0xffff00);
      
      const statusMsg = await message.reply({ embeds: [statusEmbed] });
      
      for (const batch of batches) {
        try {
          if (batch.length === 1) {
            await batch[0].delete();
            totalDeleted += 1;
          } else {
            const result = await (message.channel as BulkDeletableChannel).bulkDelete(batch, true);
            totalDeleted += result.size;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit protection
        } catch {
          // Continue with next batch if one fails
        }
      }
      
      const successEmbed = defaultEmbed(message.guild!)
        .setTitle('Batch Delete Complete')
        .setDescription(`Successfully deleted ${totalDeleted} out of ${messages.length} message(s).`)
        .addFields({ name: 'Note', value: 'Some messages may have failed to delete if they were too old (14+ days).' })
        .setColor(0x00ff00);
      
      await statusMsg.edit({ embeds: [successEmbed] });
      
    } catch (error) {
      await message.reply('Failed to delete messages between those IDs. Make sure the IDs are valid and I have permission to manage messages.');
    }
  },
};

export const commands: PrefixCommand[] = [purgeCommand, purgeAllCommand, purgeBetweenCommand];