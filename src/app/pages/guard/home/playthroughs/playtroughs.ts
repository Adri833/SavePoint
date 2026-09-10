import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlaythroughService } from '../../../../services/playtrough.service';
import { Playthrough } from '../../../../models/playtrough.model';
import { PlaythroughDetailModal } from '../../../../shared/components/playthrough-detail-modal/playthrough-detail-modal';
import { SearchService } from '../../../../services/search.service';
import { getPlaythroughState } from '../../../../utils/playthrough-state';
import { GameDTO } from '../../../../utils/game-mapper';
import { firstValueFrom, forkJoin } from 'rxjs';
import { GamesService } from '../../../../services/games.service';
import { Desplegable, SelectOption } from '../../../../shared/components/desplegable/desplegable';

type StatusType = 'all' | 'playing' | 'finished' | 'platinum' | 'online' | 'dropped';

@Component({
  selector: 'app-playthroughs',
  standalone: true,
  imports: [CommonModule, FormsModule, PlaythroughDetailModal, Desplegable],
  templateUrl: './playthroughs.html',
  styleUrl: './playthroughs.scss',
})
export class Playthroughs implements OnInit {
  selectedStatus: StatusType = 'all';
  selectedPlaythrough: Playthrough | null = null;

  playthroughs: Playthrough[] = [];
  loading = false;
  error: string | null = null;
  playthroughToFinish: Playthrough | null = null;

  years: number[] = [];
  yearOptions: SelectOption<number>[] = [];
  selectedYear!: number;
  showGrid = true;

  readonly statusOptions: SelectOption<StatusType>[] = [
    { label: 'Todos', value: 'all' },
    { label: 'En curso', value: 'playing' },
    { label: 'Completado', value: 'finished' },
    { label: '100%', value: 'platinum' },
    { label: 'Online', value: 'online' },
    { label: 'Abandonado', value: 'dropped' },
  ];

  constructor(
    private playthroughService: PlaythroughService,
    private searchService: SearchService,
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

      const orphans = this.playthroughs.filter((p) => !p.game_name);
      if (orphans.length) {
        const requests = orphans.map((p) => this.gamesService.getGameById(p.game_id));
        const games: GameDTO[] = await firstValueFrom(forkJoin(requests));
        games.forEach((game, i) => {
          orphans[i].game_name = game.name;
          orphans[i].game_background = game.background_image ?? '';
          orphans[i].game_released = game.released ?? '';
        });

        await Promise.all(
          orphans.map((p) =>
            this.playthroughService.updateGameInfo(
              p.id,
              p.game_name,
              p.game_background,
              p.game_released ?? '',
            ),
          ),
        );
      }

      this.playthroughs.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
      );

      if (this.playthroughs.length) {
        this.years = this.extractYears(this.playthroughs);
        this.selectedYear = this.years[0];

        this.yearOptions = this.years.map((y) => ({
          label: y.toString(),
          value: y,
        }));
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

    const statusMap: Record<string, string> = {
      playing: 'playing',
      platinum: 'platinum',
      finished: 'completed',
      online: 'online',
      dropped: 'abandoned',
    };

    return this.playthroughs.filter((p) => {
      let inYear: boolean;

      if (p.ended_at) {
        inYear = p.ended_at.getFullYear() === this.selectedYear;
      } else {
        inYear =
          p.started_at.getFullYear() <= this.selectedYear && this.selectedYear <= currentYear;
      }

      const statusMatch =
        this.selectedStatus === 'all' ||
        getPlaythroughState(p).cssClass === statusMap[this.selectedStatus];

      return inYear && statusMatch;
    });
  }

  onStatusChange(status: StatusType) {
    this.selectedStatus = status;
    this.onFilterChange();
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

  getState = getPlaythroughState;

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

  openSearch() {
    this.searchService.setQuery(' ');
    this.searchService.triggerFocus();
  }
}
