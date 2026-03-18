import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError, from } from 'rxjs';
import { FriendshipService } from '../../../../services/friendship.service';
import { FriendshipWithProfile, Friendship } from '../../../../models/friendship.model';
import { Profile } from '../../../../models/profile.model';

interface SearchResult extends Profile {
  friendship: Friendship | null;
}

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friends.html',
  styleUrl: './friends.scss',
})
export class Friends implements OnInit {
  friends: FriendshipWithProfile[] = [];
  pendingReceived: FriendshipWithProfile[] = [];
  pendingSent: FriendshipWithProfile[] = [];

  searchQuery = '';
  searchResults: SearchResult[] = [];
  searchLoading = false;

  loading = true;
  actionLoading: Set<string> = new Set();

  private search$ = new Subject<string>();

  constructor(
    private friendshipService: FriendshipService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.setupSearch();
    await this.loadAll();
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
    this.search$
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
        const results: SearchResult[] = await Promise.all(
          profiles.map(async (p) => ({
            ...p,
            friendship: await this.friendshipService.getFriendshipWith(p.id),
          })),
        );
        this.searchResults = results;
        this.searchLoading = false;
        this.cdr.detectChanges();
      });
  }

  onSearchInput() {
    this.search$.next(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  // ========== ACTIONS ==========

  async sendRequest(profile: SearchResult) {
    this.actionLoading.add(profile.id);
    this.cdr.detectChanges();

    try {
      const friendship = await this.friendshipService.sendRequest(profile.id);
      profile.friendship = friendship;
      await this.loadAll();
    } catch (e) {
      console.error(e);
    } finally {
      this.actionLoading.delete(profile.id);
      this.cdr.detectChanges();
    }
  }

  async accept(f: FriendshipWithProfile) {
    this.actionLoading.add(f.id);
    this.cdr.detectChanges();

    try {
      await this.friendshipService.accept(f.id);
      await this.loadAll();
    } finally {
      this.actionLoading.delete(f.id);
      this.cdr.detectChanges();
    }
  }

  async reject(f: FriendshipWithProfile) {
    this.actionLoading.add(f.id);
    this.cdr.detectChanges();

    try {
      await this.friendshipService.remove(f.id);
      await this.loadAll();
    } finally {
      this.actionLoading.delete(f.id);
      this.cdr.detectChanges();
    }
  }

  async remove(f: FriendshipWithProfile) {
    this.actionLoading.add(f.id);
    this.cdr.detectChanges();

    try {
      await this.friendshipService.remove(f.id);
      await this.loadAll();
    } finally {
      this.actionLoading.delete(f.id);
      this.cdr.detectChanges();
    }
  }

  async cancelRequest(f: FriendshipWithProfile) {
    this.actionLoading.add(f.id);
    this.cdr.detectChanges();

    try {
      await this.friendshipService.remove(f.id);
      await this.loadAll();
      const result = this.searchResults.find((r) => r.id === f.friend_id);
      if (result) result.friendship = null;
    } finally {
      this.actionLoading.delete(f.id);
      this.cdr.detectChanges();
    }
  }

  // ========== NAVIGATION ==========

  goToProfile(username: string) {
    this.router.navigate(['/home/u', username]);
  }

  goToBiblioteca(username: string) {
    this.router.navigate(['/home/u', username, 'biblioteca']);
  }

  // ========== HELPERS ==========

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
      const isSent = this.pendingSent.some((f) => f.friend_id === result.id);
      return isSent ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  }
}
