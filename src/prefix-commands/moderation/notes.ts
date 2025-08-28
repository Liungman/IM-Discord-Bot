import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';
import { defaultEmbed, errorEmbed } from '../../lib/embeds.js';
import { addNote, removeNote, clearNotes, getNotes } from '../../storage/notes.js';

const notesAddCommand: PrefixCommand = {
  name: 'notes add',
  description: 'Add a note to a user.',
  usage: '?notes add @user <note>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user: `?notes add @user <note>`');
      return;
    }
    
    const note = args.slice(1).join(' ');
    if (!note) {
      await message.reply('Please provide a note: `?notes add @user <note>`');
      return;
    }
    
    const noteId = addNote(target.id, message.guild.id, note, message.author.id);
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Note Added')
      .addFields(
        { name: 'Target', value: `${target.tag} (${target.id})` },
        { name: 'Note ID', value: noteId },
        { name: 'Note', value: note.substring(0, 1000) }, // Truncate if too long
        { name: 'Added By', value: `${message.author.tag}` }
      )
      .setColor(0x4444ff);
    
    await message.reply({ embeds: [embed] });
  },
};

const notesRemoveCommand: PrefixCommand = {
  name: 'notes remove',
  description: 'Remove a specific note from a user.',
  usage: '?notes remove @user <noteId>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user: `?notes remove @user <noteId>`');
      return;
    }
    
    const noteId = args[1];
    if (!noteId) {
      await message.reply('Please provide a note ID: `?notes remove @user <noteId>`');
      return;
    }
    
    const removed = removeNote(target.id, message.guild.id, noteId);
    
    if (removed) {
      const embed = defaultEmbed(message.guild)
        .setTitle('Note Removed')
        .addFields(
          { name: 'Target', value: `${target.tag} (${target.id})` },
          { name: 'Note ID', value: noteId },
          { name: 'Removed By', value: `${message.author.tag}` }
        )
        .setColor(0xff8800);
      
      await message.reply({ embeds: [embed] });
    } else {
      await message.reply({ embeds: [errorEmbed('Note not found. Check the note ID and user.')] });
    }
  },
};

const notesClearCommand: PrefixCommand = {
  name: 'notes clear',
  description: 'Clear all notes from a user.',
  usage: '?notes clear @user',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user: `?notes clear @user`');
      return;
    }
    
    const count = clearNotes(target.id, message.guild.id);
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Notes Cleared')
      .addFields(
        { name: 'Target', value: `${target.tag} (${target.id})` },
        { name: 'Notes Removed', value: count.toString() },
        { name: 'Cleared By', value: `${message.author.tag}` }
      )
      .setColor(0xff4444);
    
    await message.reply({ embeds: [embed] });
  },
};

const notesViewCommand: PrefixCommand = {
  name: 'notes',
  description: 'View all notes for a user.',
  usage: '?notes @user',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message, args) {
    if (!message.guild) return;
    
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user: `?notes @user`');
      return;
    }
    
    const notes = getNotes(target.id, message.guild.id);
    
    if (notes.length === 0) {
      await message.reply({ embeds: [errorEmbed(`No notes found for ${target.tag}.`)] });
      return;
    }
    
    const embed = defaultEmbed(message.guild)
      .setTitle(`Notes for ${target.tag}`)
      .setDescription(`${notes.length} note(s) found`);
    
    // Show up to 5 most recent notes
    const recentNotes = notes
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
    
    for (const note of recentNotes) {
      try {
        const addedBy = await message.client.users.fetch(note.addedBy);
        const timestamp = `<t:${Math.floor(note.timestamp / 1000)}:R>`;
        
        embed.addFields({
          name: `Note #${note.id} - ${timestamp}`,
          value: `${note.note.substring(0, 200)}${note.note.length > 200 ? '...' : ''}\n*Added by ${addedBy.tag}*`,
          inline: false
        });
      } catch {
        embed.addFields({
          name: `Note #${note.id}`,
          value: `${note.note.substring(0, 200)}${note.note.length > 200 ? '...' : ''}\n*Added by Unknown User*`,
          inline: false
        });
      }
    }
    
    if (notes.length > 5) {
      embed.setFooter({ text: `Showing 5 of ${notes.length} notes` });
    }
    
    await message.reply({ embeds: [embed] });
  },
};

export const commands: PrefixCommand[] = [
  notesAddCommand,
  notesRemoveCommand,
  notesClearCommand,
  notesViewCommand
];