import { logger } from '../core/logger.js';

interface UserNote {
  id: string; // Unique note ID
  userId: string;
  guildId: string;
  note: string;
  addedBy: string; // User ID of who added the note
  timestamp: number; // Unix timestamp
}

// In-memory storage
const userNotes = new Map<string, UserNote[]>();

let noteIdCounter = 1;

export function addNote(userId: string, guildId: string, note: string, addedBy: string): string {
  const key = `${guildId}:${userId}`;
  const noteId = (noteIdCounter++).toString();
  
  const noteEntry: UserNote = {
    id: noteId,
    userId,
    guildId,
    note,
    addedBy,
    timestamp: Date.now()
  };
  
  if (!userNotes.has(key)) {
    userNotes.set(key, []);
  }
  
  userNotes.get(key)!.push(noteEntry);
  
  logger.info({ userId, guildId, noteId, addedBy }, 'Added user note');
  return noteId;
}

export function removeNote(userId: string, guildId: string, noteId: string): boolean {
  const key = `${guildId}:${userId}`;
  const notes = userNotes.get(key);
  
  if (!notes) return false;
  
  const initialLength = notes.length;
  const filteredNotes = notes.filter(note => note.id !== noteId);
  
  if (filteredNotes.length === initialLength) {
    return false; // Note not found
  }
  
  if (filteredNotes.length === 0) {
    userNotes.delete(key);
  } else {
    userNotes.set(key, filteredNotes);
  }
  
  logger.info({ userId, guildId, noteId }, 'Removed user note');
  return true;
}

export function clearNotes(userId: string, guildId: string): number {
  const key = `${guildId}:${userId}`;
  const notes = userNotes.get(key);
  const count = notes ? notes.length : 0;
  
  if (count > 0) {
    userNotes.delete(key);
    logger.info({ userId, guildId, count }, 'Cleared all user notes');
  }
  
  return count;
}

export function getNotes(userId: string, guildId: string): UserNote[] {
  const key = `${guildId}:${userId}`;
  return userNotes.get(key) || [];
}

export function getAllNotesInGuild(guildId: string): UserNote[] {
  const allNotes: UserNote[] = [];
  
  for (const [key, notes] of userNotes.entries()) {
    if (key.startsWith(`${guildId}:`)) {
      allNotes.push(...notes);
    }
  }
  
  return allNotes.sort((a, b) => b.timestamp - a.timestamp);
}

export function searchNotes(guildId: string, searchTerm: string): UserNote[] {
  const allNotes = getAllNotesInGuild(guildId);
  const term = searchTerm.toLowerCase();
  
  return allNotes.filter(note => 
    note.note.toLowerCase().includes(term) ||
    note.userId.includes(searchTerm) // Allow searching by user ID
  );
}