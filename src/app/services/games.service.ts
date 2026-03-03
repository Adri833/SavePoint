import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { RawgService } from './rawg.service';
import { GameDTO } from '../utils/game-mapper';

const CACHE_PREFIX = 'game_cache_';
const CACHE_TTL_MS = 1000 * 60 * 60; 

interface CachedEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class GamesService {
  private pendingRequests = new Map<number, Observable<GameDTO>>();

  constructor(private rawgService: RawgService) {}

  // ===== STORAGE HELPERS =====

  private setStorage<T>(key: string, data: T): void {
    const entry: CachedEntry<T> = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      this.purgeExpired();
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch {
        console.warn('localStorage full, cache not saved');
      }
    }
  }

  private getStorage<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const entry: CachedEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private purgeExpired(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => {
        try {
          const entry: CachedEntry<unknown> = JSON.parse(localStorage.getItem(k)!);
          if (Date.now() > entry.expiresAt) localStorage.removeItem(k);
        } catch {
          localStorage.removeItem(k);
        }
      });
  }

  // ===== API METHODS =====

  getTrendingGames(): Observable<GameDTO[]> {
    return this.rawgService.getTrendingGames();
  }

  getUpComingGames(): Observable<GameDTO[]> {
    return this.rawgService.getUpcomingGames();
  }

  getThisWeekGames(): Observable<GameDTO[]> {
    return this.rawgService.getGamesThisWeek();
  }

  getGameById(id: number): Observable<GameDTO> {
    const cacheKey = `${CACHE_PREFIX}${id}`;
    const cached = this.getStorage<GameDTO>(cacheKey);

    if (cached) {
      return of(cached);
    }

    if (this.pendingRequests.has(id)) {
      return this.pendingRequests.get(id)!;
    }

    const request$ = this.rawgService.getGameById(String(id)).pipe(
      tap((game) => {
        this.setStorage(cacheKey, game);
        this.pendingRequests.delete(id);
      }),
      shareReplay(1),
    );

    this.pendingRequests.set(id, request$);
    return request$;
  }

  getGameScreenshots(id: number): Observable<any[]> {
    return this.rawgService.getGameScreenshots(String(id));
  }

  searchGames(query: string): Observable<GameDTO[]> {
    return this.rawgService.searchGames(query);
  }

  clearCache(): void {
    this.pendingRequests.clear();
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  }
}
