import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Profile } from '../../../models/profile.model';
import { ProfileService } from '../../../services/profile.service';
import { FavoriteGamesComponent } from '../../../shared/components/favorite-games/favorite-games';
import { RecentPlatinum } from '../../../shared/components/recent-platinum/recent-platinum';
import { supabase } from '../../../supabase.client';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FavoriteGamesComponent, RecentPlatinum, RouterLink],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile implements OnInit {
  profile: Profile | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) {
      this.router.navigate(['/']);
      return;
    }

    try {
      this.profile = await this.profileService.getProfileByUsername(username);
      if (!this.profile) {
        this.error = 'Este perfil no existe o es privado.';
      }
    } catch (err: any) {
      this.error = err.message ?? 'Error al cargar el perfil';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  get avatarInitial(): string {
    return this.profile?.username?.charAt(0).toUpperCase() ?? '?';
  }

  get memberSince(): string {
    if (!this.profile?.created_at) return '';
    return this.profile.created_at.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  }

  goToBiblioteca() {
    this.router.navigate(['/u', this.profile!.username, 'playthroughs']);
  }

  async goToHome(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  this.router.navigate(data.session ? ['/home/playthroughs'] : ['/']);
}
}
