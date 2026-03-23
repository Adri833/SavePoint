import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../../services/search.service';
import { Router } from '@angular/router';
import { PlatformIcons } from '../platform-icons/platform-icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search-overlay',
  imports: [CommonModule, PlatformIcons],
  templateUrl: './search-overlay.html',
  styleUrl: './search-overlay.scss',
  standalone: true,
})
export class SearchOverlay implements OnInit, OnDestroy {
  query = '';
  results: any[] = [];
  loading = false;

  private subs = new Subscription();

  constructor(
    private searchService: SearchService,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.subs.add(
      this.searchService.query$.subscribe((q) => {
        this.query = q;
        this.cd.detectChanges();
      }),
    );

    this.subs.add(
      this.searchService.results$.subscribe((r) => {
        this.results = r;
        this.cd.detectChanges();
      }),
    );

    this.subs.add(
      this.searchService.loading$.subscribe((l) => {
        this.loading = l;
        this.cd.detectChanges();
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  goToGame(gameId: number) {
    this.searchService.clear();
    document.body.style.overflow = '';
    this.router.navigate(['/home/game', gameId]);
  }

  @HostListener('document:keydown', ['$event'])
  onEsc(event: KeyboardEvent) {
    if (event.key === 'Escape') this.closeOverlay();
  }

  closeOverlay() {
    this.searchService.clear();
    document.body.style.overflow = '';
  }
}
