import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  VoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
} from '@discordjs/voice';
import { VoiceChannel, Guild } from 'discord.js';
import { createReadStream } from 'fs';
import { logger } from '../core/logger.js';

export interface QueueItem {
  title: string;
  url: string;
  duration: number;
  requestedBy: string;
  source: 'youtube' | 'soundcloud' | 'spotify' | 'file';
}

export type RepeatMode = 'off' | 'one' | 'all';

export class GuildPlayer {
  public readonly guildId: string;
  public readonly guild: Guild;
  public connection: VoiceConnection | null = null;
  public player: AudioPlayer | null = null;
  public queue: QueueItem[] = [];
  public currentTrack: QueueItem | null = null;
  public volume = 100;
  public repeatMode: RepeatMode = 'off';
  public paused = false;
  
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private readonly inactivityMs = 5 * 60 * 1000; // 5 minutes

  constructor(guild: Guild) {
    this.guild = guild;
    this.guildId = guild.id;
  }

  async joinChannel(channel: VoiceChannel): Promise<boolean> {
    try {
      // Leave current channel if connected to a different one
      if (this.connection && this.connection.joinConfig.channelId !== channel.id) {
        this.connection.destroy();
      }

      if (!this.connection || this.connection.state.status === VoiceConnectionStatus.Destroyed) {
        this.connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator as any,
        });

        this.connection.on('stateChange', (oldState, newState) => {
          logger.info({
            guildId: this.guildId,
            oldState: oldState.status,
            newState: newState.status
          }, 'Voice connection state changed');

          if (newState.status === VoiceConnectionStatus.Destroyed) {
            this.cleanup();
          }
        });

        this.connection.on('error', (error) => {
          logger.error({ guildId: this.guildId, error }, 'Voice connection error');
          this.cleanup();
        });
      }

      if (!this.player) {
        this.player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });

        this.player.on('stateChange', (oldState, newState) => {
          logger.debug({
            guildId: this.guildId,
            oldState: oldState.status,
            newState: newState.status
          }, 'Audio player state changed');

          if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
            this.handleTrackEnd();
          }
        });

        this.player.on('error', (error) => {
          logger.error({ guildId: this.guildId, error }, 'Audio player error');
          this.handleTrackEnd();
        });
      }

      this.connection.subscribe(this.player);
      this.resetInactivityTimer();
      return true;
    } catch (error) {
      logger.error({ guildId: this.guildId, channelId: channel.id, error }, 'Failed to join voice channel');
      return false;
    }
  }

  addToQueue(item: QueueItem): void {
    this.queue.push(item);
    this.resetInactivityTimer();
  }

  addToQueueNext(item: QueueItem): void {
    this.queue.unshift(item);
    this.resetInactivityTimer();
  }

  removeFromQueue(position: number): QueueItem | null {
    if (position < 0 || position >= this.queue.length) return null;
    return this.queue.splice(position, 1)[0];
  }

  moveInQueue(fromPos: number, toPos: number): boolean {
    if (fromPos < 0 || fromPos >= this.queue.length || toPos < 0 || toPos >= this.queue.length) {
      return false;
    }
    const item = this.queue.splice(fromPos, 1)[0];
    this.queue.splice(toPos, 0, item);
    return true;
  }

  shuffleQueue(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  clearQueue(): void {
    this.queue = [];
  }

  async play(resource?: AudioResource): Promise<boolean> {
    if (!this.player || !this.connection) return false;

    try {
      if (resource) {
        this.player.play(resource);
      } else if (this.queue.length > 0) {
        const track = this.queue.shift()!;
        this.currentTrack = track;
        
        // For now, we'll implement basic file playback
        // Full implementation would use play-dl for streaming
        logger.info({ guildId: this.guildId, track: track.title }, 'Playing track');
        
        // This is a placeholder - actual implementation would stream from URL
        // const stream = await play-dl or similar streaming
        // const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
        // this.player.play(resource);
      }

      this.paused = false;
      this.resetInactivityTimer();
      return true;
    } catch (error) {
      logger.error({ guildId: this.guildId, error }, 'Failed to play track');
      return false;
    }
  }

  pause(): boolean {
    if (this.player && this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause();
      this.paused = true;
      return true;
    }
    return false;
  }

  resume(): boolean {
    if (this.player && this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
      this.paused = false;
      this.resetInactivityTimer();
      return true;
    }
    return false;
  }

  stop(): void {
    if (this.player) {
      this.player.stop();
    }
    this.currentTrack = null;
    this.paused = false;
  }

  skip(): boolean {
    if (this.player && this.currentTrack) {
      this.player.stop(); // This will trigger handleTrackEnd
      return true;
    }
    return false;
  }

  disconnect(): void {
    this.cleanup();
  }

  private handleTrackEnd(): void {
    const previousTrack = this.currentTrack;
    this.currentTrack = null;

    if (this.repeatMode === 'one' && previousTrack) {
      this.queue.unshift(previousTrack);
    } else if (this.repeatMode === 'all' && previousTrack) {
      this.queue.push(previousTrack);
    }

    if (this.queue.length > 0) {
      this.play();
    } else {
      this.resetInactivityTimer();
    }
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    this.inactivityTimeout = setTimeout(() => {
      logger.info({ guildId: this.guildId }, 'Disconnecting due to inactivity');
      this.disconnect();
    }, this.inactivityMs);
  }

  private cleanup(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }

    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }

    this.player = null;
    this.currentTrack = null;
    this.paused = false;
  }
}

class PlayerManagerSingleton {
  private players = new Map<string, GuildPlayer>();

  getPlayer(guild: Guild): GuildPlayer {
    let player = this.players.get(guild.id);
    if (!player) {
      player = new GuildPlayer(guild);
      this.players.set(guild.id, player);
    }
    return player;
  }

  removePlayer(guildId: string): void {
    const player = this.players.get(guildId);
    if (player) {
      player.disconnect();
      this.players.delete(guildId);
    }
  }
}

export const PlayerManager = new PlayerManagerSingleton();