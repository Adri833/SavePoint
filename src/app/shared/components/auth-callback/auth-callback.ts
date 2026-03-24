import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../../supabase.client';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  standalone: true,
  template: '',
})
export class AuthCallback implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
  ) {}

  async ngOnInit() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get('type');

    if (type === 'recovery') {
      this.router.navigate(['/reset-password']);
      return;
    }

    const { data, error } = await supabase.auth.getSession();

    if (data.session?.user) {
      await this.handleUserProfile(data.session.user);
      this.router.navigate(['/home/playthroughs']);
      return;
    }

    const sub = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        sub.data.subscription.unsubscribe();
        await this.handleUserProfile(session.user);
        this.router.navigate(['/home/playthroughs']);
      } else if (event === 'SIGNED_OUT') {
        sub.data.subscription.unsubscribe();
        this.router.navigate(['/landing']);
      }
    });
  }

  private async handleUserProfile(user: any) {
    const provider = user.app_metadata?.provider;

    if (provider === 'google') {
      const name = user.user_metadata?.name || user.user_metadata?.full_name;
      const avatarUrl = user.user_metadata?.avatar_url;
      if (!name) return;

      let baseUsername = this.generateUsername(name);
      let finalUsername = baseUsername;
      let counter = 1;

      while (!(await this.profileService.isUsernameAvailable(finalUsername))) {
        finalUsername = `${baseUsername}${counter++}`;
      }

      await this.profileService.updateProfile({
        username: finalUsername,
        avatar_url: avatarUrl,
      });
      return;
    }

    const username = user.user_metadata?.username;
    if (username) {
      const available = await this.profileService.isUsernameAvailable(username);
      const finalUsername = available ? username : `${username}${Math.floor(Math.random() * 1000)}`;

      await this.profileService.updateProfile({ username: finalUsername });
    }
  }

  private generateUsername(name: string): string {
    return name
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .slice(0, 15);
  }
}
