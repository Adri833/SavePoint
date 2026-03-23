import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { PlaythroughService } from '../../../services/playtrough.service';
import { GamesService } from '../../../services/games.service';
import { catchError, forkJoin, of } from 'rxjs';
import { Playthrough } from '../../../models/playtrough.model';
import { CloseButton } from '../close-button/close-button';

interface PlatinumEntry {
  playthrough: Playthrough;
  gameName: string;
  gameCover: string | null;
}

@Component({
  selector: 'app-all-platinum-modal',
  imports: [CommonModule, CloseButton],
  templateUrl: './all-platinum-modal.html',
  styleUrl: './all-platinum-modal.scss',
})
export class AllPlatinumModal {
  entries: PlatinumEntry[] = [];
  loading = true;
  error: string | null = null;

  private _show = false;

  @Input() userId?: string;

  @Input()
  set show(value: boolean) {
    this._show = value;
    this.showChange.emit(this._show);

    if (this._show) {
      this.loadPlatinums();
    }
  }

  get show(): boolean {
    return this._show;
  }

  @Output() showChange = new EventEmitter<boolean>();

  constructor(
    private playthroughService: PlaythroughService,
    private gamesService: GamesService,
    private cdr: ChangeDetectorRef,
  ) {}

  async loadPlatinums() {
    this.loading = true;
    this.error = null;
    this.entries = [];

    try {
      const playthroughs = this.userId
        ? await this.playthroughService.getRecentPlatinumsByUserId(this.userId, 100)
        : await this.playthroughService.getRecentPlatinums(100);

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

  closeModal() {
    this.show = false;
  }

  formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ===== ESC listener =====
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.show) {
      this.closeModal();
    }
  }
}
