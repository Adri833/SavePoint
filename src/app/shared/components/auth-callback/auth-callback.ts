import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../../supabase.client';
@Component({
  selector: 'app-auth-callback',
  imports: [],
  standalone: true,
  template: '',
})
export class AuthCallback implements OnInit {
  constructor(private router: Router) {}

  async ngOnInit() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get('type');

    if (type === 'recovery') {
      this.router.navigate(['/reset-password']);
      return;
    }

    const { data } = await supabase.auth.getSession();

    if (data.session) {
      this.router.navigate(['/home/playthroughs']);
      return;
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.router.navigate(['/home/playthroughs']);
      } else if (!session) {
        this.router.navigate(['/landing']);
      }
    });
  }
}
