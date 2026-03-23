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

    const { data } = await this.authService.getSession();
    const user = data.session?.user;

    if (user) {
      await this.handleUserProfile(user);
      this.router.navigate(['/home/playthroughs']);
      return;
    }

    this.authService.user$.subscribe(async (user) => {
      if (user) {
        await this.handleUserProfile(user);
        this.router.navigate(['/home/playthroughs']);
      } else {
        this.router.navigate(['/landing']);
      }
    });
  }

  private async handleUserProfile(user: any) {
    const provider = user.app_metadata?.provider;

    if (provider !== 'google') return;

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
  }

  private generateUsername(name: string): string {
    return name
      .replace(/[^\w\s]/g, '') 
      .replace(/\s+/g, '_')
      .toLowerCase()
      .slice(0, 15);
  }
}
