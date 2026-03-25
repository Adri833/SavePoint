import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../../../models/profile.model';
import { ProfileService } from '../../../../services/profile.service';
import { EditProfileModal } from '../../../../shared/components/edit-profile-modal/edit-profile-modal';
import { FavoriteGamesComponent } from '../../../../shared/components/favorite-games/favorite-games';
import { RecentPlatinum } from '../../../../shared/components/recent-platinum/recent-platinum';
import { AuthService } from '../../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, EditProfileModal, FavoriteGamesComponent, RecentPlatinum],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  profile: Profile | null = null;
  loading = true;
  error: string | null = null;
  showEditModal = false;
  linkCopied = false;
  togglingPublic = false;

  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.loadProfile();
  }

  /* ========== LOAD ========== */

  async loadProfile() {
    try {
      this.loading = true;
      this.profile = await this.profileService.getOwnProfile();
    } catch (err: any) {
      this.error = err.message ?? 'Error al cargar el perfil';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  /* ========== MODAL ========== */

  openEditModal() {
    this.showEditModal = true;
  }

  onProfileUpdated(updated: Profile) {
    this.profile = updated;
    this.showEditModal = false;
  }

  /* ========== SHARE ========== */

  async copyProfileLink() {
    if (!this.profile) return;

    const url = `${window.location.origin}/u/${this.profile.username}`;

    await navigator.clipboard.writeText(url);

    this.linkCopied = true;
    this.cdr.detectChanges();
    setTimeout(() => (this.linkCopied = false), 2000);
  }

  async togglePublic() {
    if (!this.profile || this.togglingPublic) return;

    this.togglingPublic = true;
    this.cdr.detectChanges();

    try {
      this.profile = await this.profileService.togglePublic(this.profile.is_public);
    } catch (err: any) {
      this.error = err.message ?? 'Error al cambiar la visibilidad';
    } finally {
      this.togglingPublic = false;
      this.cdr.detectChanges();
    }
  }

  /* ========== HELPERS ========== */

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

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
