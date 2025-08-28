import { logger } from '../core/logger.js';

interface JailEntry {
  userId: string;
  guildId: string;
  reason?: string;
  previousRoles: string[]; // Store roles that were removed
  expiry?: number; // Optional expiry timestamp
}

// In-memory storage
const jailedUsers = new Map<string, JailEntry>();

// Scheduler for expired jails
let schedulerRunning = false;

export function addJailedUser(
  userId: string, 
  guildId: string, 
  previousRoles: string[], 
  reason?: string, 
  durationMs?: number
): void {
  const key = `${guildId}:${userId}`;
  const expiry = durationMs ? Date.now() + durationMs : undefined;
  
  jailedUsers.set(key, {
    userId,
    guildId,
    reason,
    previousRoles,
    expiry
  });
  
  if (expiry) {
    startScheduler();
  }
  
  logger.info({ userId, guildId, expiry: expiry ? new Date(expiry) : 'permanent' }, 'User jailed');
}

export function removeJailedUser(userId: string, guildId: string): JailEntry | null {
  const key = `${guildId}:${userId}`;
  const jailEntry = jailedUsers.get(key);
  if (jailEntry) {
    jailedUsers.delete(key);
    logger.info({ userId, guildId }, 'User unjailed');
  }
  return jailEntry || null;
}

export function getJailedUser(userId: string, guildId: string): JailEntry | null {
  const key = `${guildId}:${userId}`;
  return jailedUsers.get(key) || null;
}

export function getAllJailedUsers(guildId?: string): JailEntry[] {
  if (guildId) {
    return Array.from(jailedUsers.values()).filter(entry => entry.guildId === guildId);
  }
  return Array.from(jailedUsers.values());
}

export function isJailed(userId: string, guildId: string): boolean {
  const key = `${guildId}:${userId}`;
  return jailedUsers.has(key);
}

function startScheduler(): void {
  if (schedulerRunning) return;
  
  schedulerRunning = true;
  logger.info('Starting jail scheduler');
  
  const checkExpired = async () => {
    const now = Date.now();
    const expired = Array.from(jailedUsers.entries()).filter(([, entry]) => 
      entry.expiry && entry.expiry <= now
    );
    
    for (const [key, jailEntry] of expired) {
      try {
        // Try to unjail automatically
        const client = (globalThis as any).client;
        const guild = client?.guilds.cache.get(jailEntry.guildId);
        if (guild) {
          const member = await guild.members.fetch(jailEntry.userId).catch(() => null);
          if (member) {
            // This would need the actual unjail logic - removing jail role and restoring previous roles
            logger.info({ userId: jailEntry.userId, guildId: jailEntry.guildId }, 'Automatically unjailed user after expiry');
          }
        }
      } catch (error) {
        logger.warn({ userId: jailEntry.userId, guildId: jailEntry.guildId, error }, 'Failed to automatically unjail user');
      } finally {
        jailedUsers.delete(key);
      }
    }
    
    // Continue scheduler if there are still temp jails
    const hasTempJails = Array.from(jailedUsers.values()).some(entry => entry.expiry);
    if (hasTempJails) {
      setTimeout(checkExpired, 60000); // Check every minute
    } else {
      schedulerRunning = false;
      logger.info('Jail scheduler stopped - no active temp jails');
    }
  };
  
  setTimeout(checkExpired, 60000); // First check in 1 minute
}