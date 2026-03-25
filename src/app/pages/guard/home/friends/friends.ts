import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError, from } from 'rxjs';
import { Subscription } from 'rxjs';
import { FriendshipService } from '../../../../services/friendship.service';
import { FriendshipWithProfile, Friendship } from '../../../../models/friendship.model';
import { Profile } from '../../../../models/profile.model';
import { ConfirmModal } from '../../../../shared/components/confirm-modal/confirm-modal';

interface SearchResult extends Profile {
  friendship: Friendship | null;
}

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './friends.html',
  styleUrl: './friends.scss',
})
export class Friends implements OnInit, OnDestroy {
  friends: FriendshipWithProfile[] = [];
  pendingReceived: FriendshipWithProfile[] = [];
  pendingSent: FriendshipWithProfile[] = [];
  friendToRemove: FriendshipWithProfile | null = null;

  searchQuery = '';
  searchResults: SearchResult[] = [];
  searchLoading = false;

  loading = true;
  actionLoading = new Set<string>();

  private search$ = new Subject<string>();
  private searchSub!: Subscription;

  constructor(
    private friendshipService: FriendshipService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.setupSearch();
    await this.loadAll();
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  // ========== LOAD ==========

  async loadAll() {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const [friends, received, sent] = await Promise.all([
        this.friendshipService.getFriends(),
        this.friendshipService.getPendingReceived(),
        this.friendshipService.getPendingSent(),
      ]);
      this.friends = friends;
      this.pendingReceived = received;
      this.pendingSent = sent;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // ========== SEARCH ==========

  private setupSearch() {
    this.searchSub = this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query.trim()) {
            this.searchResults = [];
            this.searchLoading = false;
            this.cdr.detectChanges();
            return of([]);
          }
          this.searchLoading = true;
          this.cdr.detectChanges();
          return from(this.friendshipService.searchByUsername(query)).pipe(
            catchError(() => of([])),
          );
        }),
      )
      .subscribe(async (profiles: any[]) => {
        this.searchResults = await Promise.all(
          profiles.map(async (p) => ({
            ...p,
            friendship: await this.friendshipService.getFriendshipWith(p.id),
          })),
        );
        this.searchLoading = false;
        this.cdr.detectChanges();
      });
  }

  onSearchInput() {
    if (this.searchQuery.trim()) {
      this.searchLoading = true;
    }
    this.search$.next(this.searchQuery);
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  // ========== ACTIONS ==========

  async sendRequest(profile: SearchResult) {
    await this.withLoading(profile.id, async () => {
      profile.friendship = await this.friendshipService.sendRequest(profile.id);
      await this.loadAll();
      this.clearSearch();
    });
  }

  async accept(f: FriendshipWithProfile) {
    await this.withLoading(f.id, async () => {
      await this.friendshipService.accept(f.id);
      await this.loadAll();
    });
  }

  async remove(f: FriendshipWithProfile) {
    this.friendToRemove = null;
    await this.withLoading(f.id, async () => {
      await this.friendshipService.remove(f.id);
      await this.loadAll();
    });
  }

  confirmRemove(f: FriendshipWithProfile) {
    this.friendToRemove = f;
    this.cdr.detectChanges();
  }

  // ========== HELPERS ==========

  private async withLoading(id: string, fn: () => Promise<void>) {
    this.actionLoading.add(id);
    this.cdr.detectChanges();
    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      this.actionLoading.delete(id);
      this.cdr.detectChanges();
    }
  }

  isLoading(id: string): boolean {
    return this.actionLoading.has(id);
  }

  avatarInitial(username: string): string {
    return username.charAt(0).toUpperCase();
  }

  getFriendshipStatus(
    result: SearchResult,
  ): 'none' | 'pending_sent' | 'pending_received' | 'accepted' {
    if (!result.friendship) return 'none';
    if (result.friendship.status === 'accepted') return 'accepted';
    if (result.friendship.status === 'pending') {
      return this.pendingSent.some((f) => f.friend_id === result.id)
        ? 'pending_sent'
        : 'pending_received';
    }
    return 'none';
  }

  goToProfile(username: string) {
    this.router.navigate(['home/u', username]);
  }
}
