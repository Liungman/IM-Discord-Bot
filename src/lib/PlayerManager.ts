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
  entersState,
} from '@discordjs/voice';
import { VoiceChannel, StageChannel, Guild, PermissionFlagsBits } from 'discord.js';
import { createReadStream } from 'fs';
import { stream as playDlStream, video_basic_info } from 'play-dl';
import * as prism from 'prism-media';
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

  async joinChannel(channel: VoiceChannel | StageChannel): Promise<boolean> {
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
          } else if (newState.status === VoiceConnectionStatus.Disconnected) {
            // Handle network changes and reconnection
            logger.info({ guildId: this.guildId }, 'Voice connection disconnected, attempting to reconnect');
          }
        });

        this.connection.on('error', (error) => {
          logger.error({ guildId: this.guildId, error }, 'Voice connection error');
          this.cleanup();
        });
      }

      // Await connection to be ready with timeout
      try {
        await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
      } catch (error) {
        logger.warn({ guildId: this.guildId, error }, 'Failed to establish voice connection within timeout');
        // Connection might still work, continue
      }

      // Handle Stage channels - request to speak if needed
      if (channel instanceof StageChannel) {
        try {
          const me = this.guild.members.me;
          if (me && !me.voice?.suppress) {
            await me.voice.setSuppressed(false);
            logger.info({ guildId: this.guildId }, 'Requested to speak in stage channel');
          }
        } catch (error) {
          logger.warn({ guildId: this.guildId, error }, 'Failed to request speak permission in stage channel');
        }
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
        
        logger.info({ guildId: this.guildId, track: track.title }, 'Playing track');
        
        // Create audio resource from the track URL
        const audioResource = await this.createAudioResourceFromTrack(track);
        if (!audioResource) {
          logger.error({ guildId: this.guildId, track: track.title }, 'Failed to create audio resource');
          this.handleTrackEnd(); // Skip to next track
          return false;
        }
        
        this.player.play(audioResource);
      }

      this.paused = false;
      this.resetInactivityTimer();
      return true;
    } catch (error) {
      logger.error({ guildId: this.guildId, error }, 'Failed to play track');
      return false;
    }
  }

  private async createAudioResourceFromTrack(track: QueueItem): Promise<AudioResource | null> {
    try {
      let stream: any;
      
      switch (track.source) {
        case 'youtube':
          // Use play-dl to get the stream
          stream = await playDlStream(track.url, { quality: 2 }); // Use highest quality
          break;
        case 'soundcloud':
          // play-dl also supports SoundCloud
          stream = await playDlStream(track.url);
          break;
        case 'file':
          // Local file stream
          stream = createReadStream(track.url);
          break;
        case 'spotify':
          // Spotify URLs need to be converted to YouTube first
          // This is a placeholder - proper implementation would search YouTube for the Spotify track
          logger.warn({ guildId: this.guildId }, 'Spotify streaming not fully implemented yet');
          return null;
        default:
          logger.warn({ guildId: this.guildId, source: track.source }, 'Unsupported track source');
          return null;
      }

      if (!stream) {
        logger.error({ guildId: this.guildId, track: track.title }, 'Failed to get stream for track');
        return null;
      }

      // Create audio resource with inline volume control
      const resource = createAudioResource(stream.stream || stream, {
        inputType: stream.type || StreamType.Arbitrary,
        inlineVolume: true,
      });

      // Set volume based on guild player volume setting
      if (resource.volume) {
        resource.volume.setVolume(this.volume / 100);
      }

      return resource;
    } catch (error) {
      logger.error({ guildId: this.guildId, error, track: track.title }, 'Error creating audio resource');
      return null;
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