import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public user$ = new BehaviorSubject<any>(null);

  constructor() {
    this.init();
  }

  private async init() {
    const { data } = await supabase.auth.getSession();
    this.user$.next(data.session?.user ?? null);

    supabase.auth.onAuthStateChange((_event, session) => {
      this.user$.next(session?.user ?? null);
    });
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    this.user$.next(data.user);
    return data;
  }

  async register(email: string, password: string, username?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username },
      },
    });
    if (error) throw error;
    if (data.session) this.user$.next(data.user);
    return data;
  }

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  }

  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }

  async logout() {
    await supabase.auth.signOut();
    this.user$.next(null);
  }

  getSession() {
    return supabase.auth.getSession();
  }
}
