import type { Client } from 'discord.js';

export interface EventModule {
  name: string;
  once?: boolean;
  execute: (client: Client, ...args: any[]) => Promise<void> | void;
}