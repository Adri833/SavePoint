import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Profile, UpdateProfilePayload } from '../models/profile.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private mapProfile(data: any): Profile {
    return {
      ...data,
      created_at: new Date(data.created_at),
    };
  }

  private async getUserId(): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  /* ========== GET ========== */

  async getOwnProfile(): Promise<Profile> {
    const userId = await this.getUserId();

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) throw error;

    return this.mapProfile(data);
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (!user) {
      if (!data.is_public) throw new Error('PRIVATE_PROFILE');
      return this.mapProfile(data);
    }

    if (data.id === user.id) return this.mapProfile(data);
    if (data.is_public) return this.mapProfile(data);

    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${data.id}),and(requester_id.eq.${data.id},addressee_id.eq.${user.id})`,
      )
      .maybeSingle();

    if (friendship) return this.mapProfile(data);

    throw Object.assign(new Error('PRIVATE_PROFILE'), { profile: this.mapProfile(data) });
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    return data === null;
  }

  /* ========== UPDATE ========== */

  async updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
    const userId = await this.getUserId();

    if (payload.username !== undefined) {
      const trimmed = payload.username.trim();
      if (trimmed.length < 1)
        throw new Error('El nombre de usuario debe tener al menos 1 caracteres');
      if (trimmed.length > 15)
        throw new Error('El nombre de usuario no puede superar los 15 caracteres');
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
        throw new Error('El nombre de usuario solo puede contener letras, números y guiones bajos');
      payload.username = trimmed;
    }

    if (payload.bio !== undefined && payload.bio !== null && payload.bio.length > 300) {
      throw new Error('La bio no puede superar los 300 caracteres');
    }

    if (payload.avatar_url !== undefined && payload.avatar_url !== null) {
      try {
        const url = new URL(payload.avatar_url);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        throw new Error('El enlace del avatar no es una URL válida');
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Este nombre de usuario ya está en uso');
      }
      throw error;
    }

    return this.mapProfile(data);
  }

  async togglePublic(current: boolean): Promise<Profile> {
    return this.updateProfile({ is_public: !current });
  }
}
