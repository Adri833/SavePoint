import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Playthrough } from '../models/playtrough.model';

@Injectable({
  providedIn: 'root',
})
export class PlaythroughService {
  private async getUserId(): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  /* ========== GET ========== */

  async getAllByUser(): Promise<Playthrough[]> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('playthroughs')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((p) => ({
      ...p,
      started_at: new Date(p.started_at),
      ended_at: p.ended_at ? new Date(p.ended_at) : null,
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
    }));
  }

  async getAllByUserId(userId: string): Promise<Playthrough[]> {
    const { data, error } = await supabase
      .from('playthroughs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((p) => ({
      ...p,
      started_at: new Date(p.started_at),
      ended_at: p.ended_at ? new Date(p.ended_at) : null,
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
    }));
  }

  async getRecentPlatinumsByUserId(userId: string, limit = 6): Promise<Playthrough[]> {
    const { data, error } = await supabase
      .from('playthroughs')
      .select('*')
      .eq('user_id', userId)
      .eq('platinum', true)
      .order('ended_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((p) => ({
      ...p,
      started_at: new Date(p.started_at),
      ended_at: p.ended_at ? new Date(p.ended_at) : null,
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
    }));
  }

  async getByGame(gameId: number): Promise<Playthrough[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('playthroughs')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((p) => ({
      ...p,
      started_at: new Date(p.started_at),
      ended_at: p.ended_at ? new Date(p.ended_at) : null,
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
    }));
  }

  async getActiveByGame(gameId: number): Promise<Playthrough | null> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('playthroughs')
      .select('*')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .eq('status', 'playing')
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      started_at: new Date(data.started_at),
      ended_at: data.ended_at ? new Date(data.ended_at) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  async getRecentPlatinums(limit = 6): Promise<Playthrough[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('playthroughs')
      .select('*')
      .eq('user_id', userId)
      .eq('platinum', true)
      .order('ended_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((p) => ({
      ...p,
      started_at: new Date(p.started_at),
      ended_at: p.ended_at ? new Date(p.ended_at) : null,
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
    }));
  }

  async countPlatinums(): Promise<number> {
    const userId = await this.getUserId();
    const { count } = await supabase
      .from('playthroughs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('platinum', true);
    return count ?? 0;
  }

  async countPlatinumsByUserId(userId: string): Promise<number> {
    const { count } = await supabase
      .from('playthroughs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('platinum', true);
    return count ?? 0;
  }

  /* ========== CREATE ========== */

  async start(
    gameId: number,
    startedAt: Date,
    gameName: string,
    gameBackground: string,
    gameReleased: string,
    notes?: string,
  ) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (startedAt > today) {
      throw new Error('La fecha de inicio no puede ser futura');
    }

    const { data, error } = await supabase
      .from('playthroughs')
      .insert({
        user_id: user.id,
        game_id: gameId,
        status: 'playing',
        started_at: startedAt.toISOString(),
        game_name: gameName,
        game_background: gameBackground,
        game_released: gameReleased,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      started_at: new Date(data.started_at),
      ended_at: data.ended_at ? new Date(data.ended_at) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    } as Playthrough;
  }

  /* ========== UPDATE ========== */

  async update(
    id: string,
    started_at: Date,
    hours: number,
    completed: boolean,
    platinum: boolean,
    online: boolean,
    notes?: string,
    ended_at?: Date,
  ) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (platinum && !completed && !online) {
      throw new Error('No se puede tener platino sin historia completada o juego online');
    }

    if (completed && online) {
      throw new Error('No puede estar activo historia y online a la vez');
    }

    if (started_at > today) {
      throw new Error('La fecha de inicio no puede ser futura');
    }

    if (ended_at && ended_at < started_at) {
      throw new Error('La fecha de fin no puede ser anterior a la de inicio');
    }

    if (ended_at && ended_at > today) {
      throw new Error('La fecha de fin no puede ser futura');
    }

    if (hours < 0) {
      throw new Error('Las horas no pueden ser negativas');
    }

    const { data, error } = await supabase
      .from('playthroughs')
      .update({
        started_at: started_at.toISOString(),
        hours,
        completed,
        platinum,
        online,
        notes: notes ?? null,
        ...(ended_at ? { ended_at: ended_at.toISOString() } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      started_at: new Date(data.started_at),
      ended_at: data.ended_at ? new Date(data.ended_at) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    } as Playthrough;
  }

  async updateGameInfo(id: string, gameName: string, gameBackground: string, gameReleased: string) {
    const { error } = await supabase
      .from('playthroughs')
      .update({
        game_name: gameName,
        game_background: gameBackground,
        game_released: gameReleased,
      })
      .eq('id', id);

    if (error) throw error;
  }

  /* ========== DELETE ========== */

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('playthroughs').delete().eq('id', id);

    if (error) throw error;
  }

  async finish(
    id: string,
    ended_at: Date,
    hours: number,
    completed: boolean,
    platinum: boolean,
    online: boolean,
    notes?: string,
  ) {
    if (platinum && !completed && !online) {
      throw new Error('No se puede tener platino sin historia completada o juego online');
    }

    if (completed && online) {
      throw new Error('No puede estar activo historia y online a la vez');
    }

    const { data, error } = await supabase
      .from('playthroughs')
      .update({
        status: 'finished',
        ended_at: ended_at.toISOString(),
        hours,
        completed,
        platinum,
        online,
        notes: notes ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      started_at: new Date(data.started_at),
      ended_at: data.ended_at ? new Date(data.ended_at) : null,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    } as Playthrough;
  }
}
