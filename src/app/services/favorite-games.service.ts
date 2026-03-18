import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { AddFavoritePayload, FavoriteGame } from '../models/favorite-games.model';

@Injectable({
  providedIn: 'root',
})
export class FavoriteGamesService {
  private async getUserId(): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  private mapFavorite(data: any): FavoriteGame {
    return {
      ...data,
      created_at: new Date(data.created_at),
    };
  }

  /* ========== GET ========== */

  async getAll(): Promise<FavoriteGame[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('favorite_games')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(this.mapFavorite);
  }

  async getAllByUserId(userId: string): Promise<FavoriteGame[]> {
    const { data, error } = await supabase
      .from('favorite_games')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  /* ========== ADD ========== */

  async add(payload: AddFavoritePayload): Promise<FavoriteGame> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('favorite_games')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    return this.mapFavorite(data);
  }

  /* ========== REMOVE ========== */

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('favorite_games').delete().eq('id', id);

    if (error) throw error;
  }

  /* ========== MOVE (reorder) ========== */

  async move(id: string, newPosition: number): Promise<void> {
    const { error } = await supabase
      .from('favorite_games')
      .update({ position: newPosition })
      .eq('id', id);

    if (error) throw error;
  }
}
