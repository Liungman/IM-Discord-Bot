import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, type TextChannel, type NewsChannel, type VoiceChannel, type ThreadChannel, User } from 'discord.js';
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

// Selective purge commands
const purgeBotsCommand: PrefixCommand = {
  name: 'purge bots',
  description: 'Delete messages from bots (up to 100).',
  usage: '?purge bots',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message) {
    if (!message.channel?.isTextBased()) return;
    await selectivePurge(message, 'bots');
  },
};

const purgeHumansCommand: PrefixCommand = {
  name: 'purge humans',
  description: 'Delete messages from humans (non-bots) (up to 100).',
  usage: '?purge humans',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message) {
    if (!message.channel?.isTextBased()) return;
    await selectivePurge(message, 'humans');
  },
};

const purgeLinksCommand: PrefixCommand = {
  name: 'purge links',
  description: 'Delete messages containing links (up to 100).',
  usage: '?purge links',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message) {
    if (!message.channel?.isTextBased()) return;
    await selectivePurge(message, 'links');
  },
};

const purgeInvitesCommand: PrefixCommand = {
  name: 'purge invites',
  description: 'Delete messages containing Discord invites (up to 100).',
  usage: '?purge invites',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message) {
    if (!message.channel?.isTextBased()) return;
    await selectivePurge(message, 'invites');
  },
};

const purgeContainsCommand: PrefixCommand = {
  name: 'purge contains',
  description: 'Delete messages containing specific text (up to 100).',
  usage: '?purge contains <text>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message, args) {
    if (!message.channel?.isTextBased()) return;
    const text = args.join(' ');
    if (!text) {
      await message.reply('Please specify text to search for: `?purge contains <text>`');
      return;
    }
    await selectivePurge(message, 'contains', text);
  },
};

const purgeStartsWithCommand: PrefixCommand = {
  name: 'purge startswith',
  description: 'Delete messages starting with specific text (up to 100).',
  usage: '?purge startswith <text>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message, args) {
    if (!message.channel?.isTextBased()) return;
    const text = args.join(' ');
    if (!text) {
      await message.reply('Please specify text to search for: `?purge startswith <text>`');
      return;
    }
    await selectivePurge(message, 'startswith', text);
  },
};

const purgeEndsWithCommand: PrefixCommand = {
  name: 'purge endswith',
  description: 'Delete messages ending with specific text (up to 100).',
  usage: '?purge endswith <text>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageMessages,
  async execute(message, args) {
    if (!message.channel?.isTextBased()) return;
    const text = args.join(' ');
    if (!text) {
      await message.reply('Please specify text to search for: `?purge endswith <text>`');
      return;
    }
    await selectivePurge(message, 'endswith', text);
  },
};

// Helper function for selective purging
async function selectivePurge(message: any, type: string, searchText?: string) {
  const statusEmbed = defaultEmbed(message.guild!)
    .setTitle('Selective Purge in Progress')
    .setDescription(`Scanning messages for ${type}...`)
    .setColor(0xffff00);
  
  const statusMsg = await message.reply({ embeds: [statusEmbed] });
  
  try {
    // Fetch up to 100 messages to filter
    const messages = await message.channel.messages.fetch({ limit: 100 });
    
    const toDelete = [];
    for (const [, msg] of messages) {
      let shouldDelete = false;
      
      switch (type) {
        case 'bots':
          shouldDelete = msg.author.bot;
          break;
        case 'humans':
          shouldDelete = !msg.author.bot;
          break;
        case 'links':
          shouldDelete = /https?:\/\/[^\s]+/i.test(msg.content || '');
          break;
        case 'invites':
          shouldDelete = /(discord\.gg|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i.test(msg.content || '');
          break;
        case 'contains':
          shouldDelete = searchText ? (msg.content || '').toLowerCase().includes(searchText.toLowerCase()) : false;
          break;
        case 'startswith':
          shouldDelete = searchText ? (msg.content || '').toLowerCase().startsWith(searchText.toLowerCase()) : false;
          break;
        case 'endswith':
          shouldDelete = searchText ? (msg.content || '').toLowerCase().endsWith(searchText.toLowerCase()) : false;
          break;
      }
      
      if (shouldDelete) {
        toDelete.push(msg);
      }
    }
    
    if (toDelete.length === 0) {
      const noMatchEmbed = defaultEmbed(message.guild!)
        .setTitle('No Messages Found')
        .setDescription(`No messages matching "${type}" filter were found in the last 100 messages.`)
        .setColor(0x808080);
      
      await statusMsg.edit({ embeds: [noMatchEmbed] });
      return;
    }
    
    // Delete in chunks for bulk delete
    let totalDeleted = 0;
    const chunks = [];
    for (let i = 0; i < toDelete.length; i += 100) {
      chunks.push(toDelete.slice(i, i + 100));
    }
    
    for (const chunk of chunks) {
      try {
        if (chunk.length === 1) {
          await chunk[0].delete();
          totalDeleted += 1;
        } else {
          const result = await (message.channel as BulkDeletableChannel).bulkDelete(chunk, true);
          totalDeleted += result.size;
        }
      } catch {
        // Continue with next chunk if one fails
      }
      
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit protection
      }
    }
    
    const successEmbed = defaultEmbed(message.guild!)
      .setTitle('Selective Purge Complete')
      .setDescription(`Successfully deleted ${totalDeleted} message(s) matching "${type}".`)
      .addFields({ name: 'Note', value: 'Messages older than 14 days cannot be bulk deleted.' })
      .setColor(0x00ff00);
    
    await statusMsg.edit({ embeds: [successEmbed] });
    
  } catch (error) {
    const errorEmbed = defaultEmbed(message.guild!)
      .setTitle('Selective Purge Failed')
      .setDescription('Failed to complete selective purge. I may lack permissions or messages are too old.')
      .setColor(0xff0000);
    
    await statusMsg.edit({ embeds: [errorEmbed] });
  }
}

export const commands: PrefixCommand[] = [
  purgeCommand, 
  purgeAllCommand, 
  purgeBetweenCommand, 
  purgeBotsCommand,
  purgeHumansCommand,
  purgeLinksCommand,
  purgeInvitesCommand,
  purgeContainsCommand,
  purgeStartsWithCommand,
  purgeEndsWithCommand
];