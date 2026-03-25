import { Injectable } from '@angular/core';
import { PlaythroughService } from './playtrough.service';
import { Playthrough } from '../models/playtrough.model';
import { DashboardStats } from '../models/dashboard-stats.model';
import { GamesService } from './games.service';
import { firstValueFrom } from 'rxjs';
import { getPlaythroughState } from '../utils/playthrough-state';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private playthroughService: PlaythroughService,
    private gamesService: GamesService,
  ) {}

  async getStatsByYear(year: number): Promise<DashboardStats> {
    const playthroughs = await this.playthroughService.getAllByUser();
    const filtered = this.filterByYear(playthroughs, year);
    const finished = filtered.filter((p) => p.status === 'finished');

    const completedCount = finished.filter((p) =>
      ['completed', 'platinum'].includes(getPlaythroughState(p).cssClass),
    ).length;

    const onlineCount = finished.filter((p) => getPlaythroughState(p).cssClass === 'online').length;

    const abandonedCount = finished.filter(
      (p) => getPlaythroughState(p).cssClass === 'abandoned',
    ).length;

    const totalPlatinum = finished.filter(
      (p) => getPlaythroughState(p).cssClass === 'platinum',
    ).length;

    const totalHours = filtered.reduce((acc, p) => acc + (p.hours ?? 0), 0);
    const abandonmentRate = finished.length === 0 ? 0 : (abandonedCount / finished.length) * 100;

    return {
      year,
      totalFinished: completedCount,
      totalPlatinum,
      totalHours,
      completedCount,
      abandonedCount,
      onlineCount,
      abandonmentRate,
    };
  }

  async getHoursByGameForYear(year: number): Promise<{ gameName: string; hours: number }[]> {
    const playthroughs = await this.playthroughService.getAllByUser();
    const filtered = this.filterByYear(playthroughs, year);

    const map = new Map<number, { gameName: string; hours: number }>();

    filtered.forEach((p) => {
      const existing = map.get(p.game_id);
      const hours = (existing?.hours ?? 0) + (p.hours ?? 0);
      map.set(p.game_id, {
        gameName: p.game_name ?? `Game #${p.game_id}`,
        hours,
      });
    });

    return Array.from(map.values());
  }

  /* ========== HELPERS ========== */

  private filterByYear(playthroughs: Playthrough[], year: number) {
    const currentYear = new Date().getFullYear();

    return playthroughs.filter((p) => {
      if (p.ended_at) {
        return p.ended_at.getFullYear() === year;
      } else {
        return p.started_at.getFullYear() <= year && year <= currentYear;
      }
    });
  }

  async getAvailableYears(): Promise<number[]> {
    const playthroughs = await this.playthroughService.getAllByUser();
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();

    playthroughs.forEach((p) => {
      if (p.ended_at) {
        years.add(p.ended_at.getFullYear());
      } else {
        for (let y = p.started_at.getFullYear(); y <= currentYear; y++) {
          years.add(y);
        }
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }
}
