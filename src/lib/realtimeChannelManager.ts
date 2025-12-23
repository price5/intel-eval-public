import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Singleton channel manager to prevent duplicate channels and handle cleanup
 */
class RealtimeChannelManager {
  private static instance: RealtimeChannelManager;
  private channels: Map<string, RealtimeChannel> = new Map();
  private cleanupInProgress: Set<string> = new Set();

  private constructor() {
    console.log('[ChannelManager] Instance created');
  }

  static getInstance(): RealtimeChannelManager {
    if (!RealtimeChannelManager.instance) {
      RealtimeChannelManager.instance = new RealtimeChannelManager();
    }
    return RealtimeChannelManager.instance;
  }

  async getOrCreateChannel(
    channelName: string,
    setup: (channel: RealtimeChannel) => RealtimeChannel
  ): Promise<RealtimeChannel> {
    // If channel exists and is in good state, return it
    const existing = this.channels.get(channelName);
    if (existing && (existing.state === 'joined' || existing.state === 'joining')) {
      console.log(`[ChannelManager] Reusing existing channel: ${channelName} (Total: ${this.channels.size})`);
      return existing;
    }

    // Wait if cleanup is in progress
    while (this.cleanupInProgress.has(channelName)) {
      console.log(`[ChannelManager] Waiting for cleanup to complete: ${channelName}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clean up existing channel if needed
    if (existing) {
      console.log(`[ChannelManager] Cleaning up stale channel: ${channelName}`);
      await this.removeChannel(channelName);
      // Add delay to ensure Supabase has processed the removal
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Warn if approaching rate limits (Supabase free tier typically allows ~100 concurrent channels)
    if (this.channels.size >= 10) {
      console.warn(`[ChannelManager] High channel count: ${this.channels.size}. Consider consolidating channels.`);
    }

    // Create new channel
    console.log(`[ChannelManager] Creating new channel: ${channelName} (Total: ${this.channels.size + 1})`);
    const channel = setup(supabase.channel(channelName));
    this.channels.set(channelName, channel);
    
    return channel;
  }

  async removeChannel(channelName: string): Promise<void> {
    this.cleanupInProgress.add(channelName);
    
    try {
      const channel = this.channels.get(channelName);
      if (channel) {
        console.log(`[ChannelManager] Removing channel: ${channelName}, state: ${channel.state}`);
        await supabase.removeChannel(channel);
        this.channels.delete(channelName);
        console.log(`[ChannelManager] Channel removed: ${channelName}`);
      }
    } catch (error) {
      console.error(`[ChannelManager] Error removing channel ${channelName}:`, error);
    } finally {
      this.cleanupInProgress.delete(channelName);
    }
  }

  async removeAllChannels(): Promise<void> {
    console.log('[ChannelManager] Removing all channels');
    const channelNames = Array.from(this.channels.keys());
    await Promise.all(channelNames.map(name => this.removeChannel(name)));
  }

  getChannel(channelName: string): RealtimeChannel | undefined {
    return this.channels.get(channelName);
  }

  getChannelState(channelName: string): string | undefined {
    return this.channels.get(channelName)?.state;
  }
}

export const channelManager = RealtimeChannelManager.getInstance();
