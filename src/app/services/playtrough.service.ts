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

  /* ========== CREATE ========== */

  async start(gameId: number, startedAt: Date, notes?: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    if (startedAt > new Date()) {
      throw new Error('La fecha de inicio no puede ser futura');
    }

    const { data, error } = await supabase
      .from('playthroughs')
      .insert({
        user_id: user.id,
        game_id: gameId,
        status: 'playing',
        started_at: startedAt.toISOString(),
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
    if (platinum && !completed && !online) {
      throw new Error('No se puede tener platino sin historia completada o juego online');
    }

    if (completed && online) {
      throw new Error('No puede estar activo historia y online a la vez');
    }

    if (started_at > new Date()) {
      throw new Error('La fecha de inicio no puede ser futura');
    }

    if (ended_at && ended_at < started_at) {
      throw new Error('La fecha de fin no puede ser anterior a la de inicio');
    }

    if (ended_at && ended_at > new Date()) {
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
