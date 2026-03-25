import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import { PlaythroughService } from '../../../../services/playtrough.service';
import { Playthrough } from '../../../../models/playtrough.model';
import { GamesService } from '../../../../services/games.service';
import { GameDTO } from '../../../../utils/game-mapper';
import { ProfileService } from '../../../../services/profile.service';
import { Profile } from '../../../../models/profile.model';
import { YearSelector } from '../../../../shared/components/year-selector/year-selector';
import { getPlaythroughState } from '../../../../utils/playthrough-state';

@Component({
  selector: 'app-user-playthroughs',
  standalone: true,
  imports: [CommonModule, FormsModule, YearSelector, RouterLink],
  templateUrl: './user-playthroughs.html',
  styleUrl: './user-playthroughs.scss',
})
export class Userplaythroughs implements OnInit {
  profile: Profile | null = null;
  playthroughs: Playthrough[] = [];

  selectedStatus: 'all' | 'playing' | 'finished' | 'platinum' | 'online' | 'dropped' = 'all';
  years: number[] = [];
  selectedYear!: number;
  showGrid = true;

  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private playthroughService: PlaythroughService,
    private gamesService: GamesService,
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
        return;
      }

      this.playthroughs = await this.playthroughService.getAllByUserId(this.profile.id);

      if (this.playthroughs.length) {
        // Fallback para partidas antiguas sin datos de juego
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

        this.years = this.extractYears(this.playthroughs);
        this.selectedYear = this.years[0];
      }
    } catch (err: any) {
      this.error = err.message ?? 'Error al cargar la playthroughs';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
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

  onYearChange(year: number) {
    this.selectedYear = year;
    this.onFilterChange();
  }

  onFilterChange() {
    this.showGrid = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showGrid = true;
      this.cdr.detectChanges();
    }, 10);
  }

  goToProfile() {
    this.router.navigate(['/home/u', this.profile!.username]);
  }

  getState = getPlaythroughState;
}
