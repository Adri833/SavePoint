import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PlaythroughService } from '../../../services/playtrough.service';
import { GamesService } from '../../../services/games.service';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Playthrough } from '../../../models/playtrough.model';

interface PlatinumEntry {
  playthrough: Playthrough;
  gameName: string;
  gameCover: string | null;
}

@Component({
  selector: 'app-recent-platinum',
  imports: [CommonModule],
  templateUrl: './recent-platinum.html',
  styleUrl: './recent-platinum.scss',
})
export class RecentPlatinum implements OnInit {
  @Input() userId?: string;

  entries: PlatinumEntry[] = [];
  loading = true;
  error: string | null = null;

  readonly skeletons = [1, 2, 3, 4];

  constructor(
    private playthroughService: PlaythroughService,
    private gamesService: GamesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    try {
      const playthroughs = this.userId
        ? await this.playthroughService.getRecentPlatinumsByUserId(this.userId, 6)
        : await this.playthroughService.getRecentPlatinums(6);

      if (playthroughs.length === 0) {
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      const gameRequests = playthroughs.map((p) =>
        this.gamesService.getGameById(p.game_id).pipe(catchError(() => of(null))),
      );

      forkJoin(gameRequests).subscribe({
        next: (games) => {
          this.entries = playthroughs.map((p, i) => ({
            playthrough: p,
            gameName: games[i]?.name ?? `Game #${p.game_id}`,
            gameCover: games[i]?.background_image ?? null,
          }));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (e) => {
          this.error = e.message ?? 'Error al cargar los juegos';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    } catch (e: any) {
      this.error = e.message ?? 'Error al cargar los platinos';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  goToAll(): void {
    this.router.navigate(['/platinum']);
  }

  animationDelay(i: number): string {
    return `${i * 60}ms`;
  }
}
