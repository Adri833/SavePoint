import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Friendship, FriendshipWithProfile } from '../models/friendship.model';
import { Profile } from '../models/profile.model';

@Injectable({
  providedIn: 'root',
})
export class FriendshipService {
  private async getUserId(): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  private mapFriendship(f: any): Friendship {
    return {
      ...f,
      created_at: new Date(f.created_at),
      updated_at: new Date(f.updated_at),
    };
  }

  // ========== GET ==========

  async getFriends(): Promise<FriendshipWithProfile[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('friendships')
      .select(
        `
        *,
        requester:profiles!friendships_requester_id_fkey(id, username, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url)
      `,
      )
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) throw error;

    return (data ?? []).map((f) => {
      const isRequester = f.requester_id === userId;
      const friend = isRequester ? f.addressee : f.requester;
      return {
        ...this.mapFriendship(f),
        friend_id: friend.id,
        friend_username: friend.username,
        friend_avatar: friend.avatar_url ?? null,
      };
    });
  }

  async getPendingReceived(): Promise<FriendshipWithProfile[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('friendships')
      .select(
        `
        *,
        requester:profiles!friendships_requester_id_fkey(id, username, avatar_url)
      `,
      )
      .eq('addressee_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    return (data ?? []).map((f) => ({
      ...this.mapFriendship(f),
      friend_id: f.requester.id,
      friend_username: f.requester.username,
      friend_avatar: f.requester.avatar_url ?? null,
    }));
  }

  async getPendingSent(): Promise<FriendshipWithProfile[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('friendships')
      .select(
        `
        *,
        addressee:profiles!friendships_addressee_id_fkey(id, username, avatar_url)
      `,
      )
      .eq('requester_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    return (data ?? []).map((f) => ({
      ...this.mapFriendship(f),
      friend_id: f.addressee.id,
      friend_username: f.addressee.username,
      friend_avatar: f.addressee.avatar_url ?? null,
    }));
  }

  async getFriendshipWith(targetId: string): Promise<Friendship | null> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`,
      )
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapFriendship(data) : null;
  }

  // ========== ACTIONS ==========

  async sendRequest(addresseeId: string): Promise<Friendship> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('friendships')
      .insert({ requester_id: userId, addressee_id: addresseeId, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return this.mapFriendship(data);
  }

  async accept(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) throw error;
  }

  async remove(friendshipId: string): Promise<void> {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);

    if (error) throw error;
  }

  // ========== SEARCH ==========

  async searchByUsername(query: string): Promise<Profile[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', userId)
      .limit(10);

    if (error) throw error;

    return (data ?? []).map((p) => ({
      ...p,
      created_at: new Date(p.created_at),
    }));
  }
}
