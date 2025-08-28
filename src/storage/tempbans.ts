import { logger } from '../core/logger.js';

interface TempBan {
  userId: string;
  guildId: string;
  reason?: string;
  expiry: number; // Unix timestamp
}

// In-memory storage (could be replaced with database)
const tempBans = new Map<string, TempBan>();

// Scheduler runs every minute to check for expired bans
let schedulerRunning = false;

export function addTempBan(userId: string, guildId: string, durationMs: number, reason?: string): void {
  const key = `${guildId}:${userId}`;
  const expiry = Date.now() + durationMs;
  
  tempBans.set(key, {
    userId,
    guildId,
    reason,
    expiry
  });
  
  startScheduler();
  logger.info({ userId, guildId, expiry: new Date(expiry) }, 'Added temporary ban');
}

export function removeTempBan(userId: string, guildId: string): boolean {
  const key = `${guildId}:${userId}`;
  const removed = tempBans.delete(key);
  if (removed) {
    logger.info({ userId, guildId }, 'Removed temporary ban');
  }
  return removed;
}

export function getTempBan(userId: string, guildId: string): TempBan | null {
  const key = `${guildId}:${userId}`;
  return tempBans.get(key) || null;
}

export function getAllTempBans(guildId?: string): TempBan[] {
  if (guildId) {
    return Array.from(tempBans.values()).filter(ban => ban.guildId === guildId);
  }
  return Array.from(tempBans.values());
}

function startScheduler(): void {
  if (schedulerRunning) return;
  
  schedulerRunning = true;
  logger.info('Starting tempban scheduler');
  
  const checkExpired = async () => {
    const now = Date.now();
    const expired = Array.from(tempBans.entries()).filter(([, ban]) => ban.expiry <= now);
    
    for (const [key, ban] of expired) {
      try {
        // Try to unban via Discord API
        const client = (globalThis as any).client;
        const guild = client?.guilds.cache.get(ban.guildId);
        if (guild) {
          await guild.members.unban(ban.userId, 'Temporary ban expired');
          logger.info({ userId: ban.userId, guildId: ban.guildId }, 'Automatically unbanned user after temp ban expiry');
        }
      } catch (error) {
        logger.warn({ userId: ban.userId, guildId: ban.guildId, error }, 'Failed to automatically unban user');
      } finally {
        tempBans.delete(key);
      }
    }
    
    // Continue scheduler if there are still tempbans
    if (tempBans.size > 0) {
      setTimeout(checkExpired, 60000); // Check every minute
    } else {
      schedulerRunning = false;
      logger.info('Tempban scheduler stopped - no active tempbans');
    }
  };
  
  setTimeout(checkExpired, 60000); // First check in 1 minute
}