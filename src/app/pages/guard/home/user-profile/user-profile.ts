import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Profile } from '../../../../models/profile.model';
import { ProfileService } from '../../../../services/profile.service';
import { FavoriteGamesComponent } from '../../../../shared/components/favorite-games/favorite-games';
import { RecentPlatinum } from '../../../../shared/components/recent-platinum/recent-platinum';
import { Friendship } from '../../../../models/friendship.model';
import { FriendshipService } from '../../../../services/friendship.service';
import { supabase } from '../../../../supabase.client';
import { ConfirmModal } from '../../../../shared/components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FavoriteGamesComponent, RecentPlatinum, RouterLink, ConfirmModal],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss',
})
export class UserProfile implements OnInit {
  profile: Profile | null = null;
  loading = true;
  error: string | null = null;
  privateProfile: Profile | null = null;

  friendship: Friendship | null = null;
  currentUserId: string | null = null;
  showRemoveFriendConfirm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private friendshipService: FriendshipService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) {
      this.router.navigate(['/']);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    this.currentUserId = user?.id ?? null;

    try {
      this.profile = await this.profileService.getProfileByUsername(username);
      if (!this.profile) {
        this.error = 'Este perfil no existe.';
      } else if (this.currentUserId && this.profile.id !== this.currentUserId) {
        this.friendship = await this.friendshipService.getFriendshipWith(this.profile.id);
      }
    } catch (e: any) {
      if (e.message === 'PRIVATE_PROFILE') {
        this.privateProfile = e.profile ?? null;
        if (this.currentUserId && this.privateProfile) {
          this.friendship = await this.friendshipService.getFriendshipWith(this.privateProfile.id);
        }
      } else {
        this.error = e.message ?? 'Error al cargar el perfil';
      }
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

  get friendshipStatus(): 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self' {
    if (!this.currentUserId) return 'none';
    if (this.profile?.id === this.currentUserId) return 'self';
    if (!this.friendship) return 'none';
    if (this.friendship.status === 'accepted') return 'accepted';
    if (this.friendship.status === 'pending') {
      return this.friendship.requester_id === this.currentUserId
        ? 'pending_sent'
        : 'pending_received';
    }
    return 'none';
  }

  async sendFriendRequest() {
    const targetId = this.profile?.id ?? this.privateProfile?.id;
    if (!targetId) return;
    this.loading = true;
    this.cdr.detectChanges();
    try {
      this.friendship = await this.friendshipService.sendRequest(targetId);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async acceptFriendRequest() {
    if (!this.friendship) return;
    this.loading = true;
    this.cdr.detectChanges();
    try {
      await this.friendshipService.accept(this.friendship.id);
      this.friendship = { ...this.friendship, status: 'accepted' };
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  confirmRemoveFriendship() {
    this.showRemoveFriendConfirm = true;
    this.cdr.detectChanges();
  }

  async removeFriendship() {
    if (!this.friendship) return;
    this.showRemoveFriendConfirm = false;
    this.loading = true;
    this.cdr.detectChanges();
    try {
      await this.friendshipService.remove(this.friendship.id);
      this.friendship = null;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  goToBiblioteca() {
    this.router.navigate(['/home/u', this.profile!.username, 'biblioteca']);
  }

  goToHome(): void {
    this.router.navigate(['/home/playthroughs']);
  }
}
