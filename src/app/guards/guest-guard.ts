import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      this.router.navigate(['/home/playthroughs']);
      return false;
    }

    return true;
  }
}