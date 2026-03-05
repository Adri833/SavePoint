import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, firstValueFrom } from 'rxjs';
import { PlaythroughService } from '../../../../services/playtrough.service';
import { Playthrough } from '../../../../models/playtrough.model';
import { GamesService } from '../../../../services/games.service';
import { GameDTO } from '../../../../utils/game-mapper';
import { PlaythroughDetailModal } from '../../../../shared/components/playthrough-detail-modal/playthrough-detail-modal';
import { YearSelector } from '../../../../shared/components/year-selector/year-selector';

@Component({
  selector: 'app-playthroughs',
  standalone: true,
  imports: [CommonModule, FormsModule, PlaythroughDetailModal, YearSelector],
  templateUrl: './playthroughs.html',
  styleUrl: './playthroughs.scss',
})
export class Playthroughs implements OnInit {
  selectedStatus: 'all' | 'playing' | 'finished' | 'platinum' | 'dropped' = 'all';
  selectedPlaythrough: Playthrough | null = null;

  playthroughs: Playthrough[] = [];
  loading = false;
  error: string | null = null;
  playthroughToFinish: Playthrough | null = null;

  years: number[] = [];
  selectedYear!: number;
  showGrid = true;

  constructor(
    private playthroughService: PlaythroughService,
    private gamesService: GamesService,
    private cd: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadLibrary();
  }

  async loadLibrary() {
    this.loading = true;
    this.cd.detectChanges();

    try {
      this.playthroughs = await this.playthroughService.getAllByUser();

      if (this.playthroughs.length) {
        const gameRequests = this.playthroughs.map((p) => this.gamesService.getGameById(p.game_id));
        const games: GameDTO[] = await firstValueFrom(forkJoin(gameRequests));

        games.forEach((game, i) => {
          const p = this.playthroughs[i];
          p.game_name = game.name;
          p.game_background = game.background_image ?? '';
          p.game_released = game.released ?? '';
        });

        this.playthroughs.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
        );

        this.years = this.extractYears(this.playthroughs);
        this.selectedYear = this.years[0];
      }
    } catch (err: any) {
      this.error = err.message ?? 'Error loading playthroughs';
    } finally {
      this.loading = false;
      this.cd.detectChanges();
    }
  }

  private extractYears(playthroughs: Playthrough[]): number[] {
    const currentYear = new Date().getFullYear();
    const yearSet = new Set<number>();

    playthroughs.forEach((p) => {
      if (p.ended_at) {
        yearSet.add(p.ended_at.getFullYear());
      } else {
        for (let y = p.started_at.getFullYear(); y <= currentYear; y++) {
          yearSet.add(y);
        }
      }
    });

    return Array.from(yearSet).sort((a, b) => b - a);
  }

  get filteredPlaythroughs(): Playthrough[] {
    const currentYear = new Date().getFullYear();

    return this.playthroughs.filter((p) => {
      let inYear: boolean;

      if (p.ended_at) {
        inYear = p.ended_at.getFullYear() === this.selectedYear;
      } else {
        inYear =
          p.started_at.getFullYear() <= this.selectedYear && this.selectedYear <= currentYear;
      }

      let statusMatch = true;
      if (this.selectedStatus !== 'all') {
        if (this.selectedStatus === 'platinum') {
          statusMatch = p.status === 'finished' && p.completed && p.platinum;
        } else if (this.selectedStatus === 'finished') {
          statusMatch = p.status === 'finished' && p.completed && !p.platinum;
        } else if (this.selectedStatus === 'playing') {
          statusMatch = p.status === 'playing';
        } else if (this.selectedStatus === 'dropped') {
          statusMatch = p.status === 'finished' && !p.completed;
        }
      }

      return inYear && statusMatch;
    });
  }

  onYearChange(year: number) {
    this.selectedYear = year;
    this.onFilterChange();
  }

  onPlaythroughDeleted() {
    this.closeDetailModal();
    this.loadLibrary();
  }

  onFilterChange() {
    this.showGrid = false;
    this.cd.detectChanges();
    setTimeout(() => {
      this.showGrid = true;
      this.cd.detectChanges();
    }, 10);
  }

  getStatusClass(p: Playthrough) {
    if (p.status === 'playing') return 'playing';
    if (p.status === 'finished' && p.completed && p.platinum) return 'platinum';
    if (p.status === 'finished' && p.completed) return 'completed';
    if (p.status === 'finished' && !p.completed) return 'dropped';
    return '';
  }

  openDetailModal(p: Playthrough) {
    this.selectedPlaythrough = p;
  }

  closeDetailModal() {
    this.selectedPlaythrough = null;
  }

  handleFinish(p: Playthrough) {
    this.playthroughToFinish = p;
    this.closeDetailModal();
    this.loadLibrary();
  }
}
