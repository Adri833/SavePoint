import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';
import { FavoriteGame } from '../../../models/favorite-games.model';
import { GameDTO } from '../../../utils/game-mapper';
import { FavoriteGamesService } from '../../../services/favorite-games.service';
import { RawgService } from '../../../services/rawg.service';
import { CloseButton } from '../close-button/close-button';

const MAX_FAVORITES = 6;

@Component({
  selector: 'app-favorite-games',
  standalone: true,
  imports: [FormsModule, CloseButton],
  templateUrl: './favorite-games.html',
  styleUrl: './favorite-games.scss',
})
export class FavoriteGamesComponent implements OnInit, OnDestroy {
  @Input() userId?: string; // si viene, modo lectura con datos de ese usuario
  @Input() readonly = false; // oculta picker y botones de edición

  favorites: FavoriteGame[] = [];
  loading = true;

  // ── Picker state (solo en modo edición) ──
  pickerSlot: number | null = null;
  searchQuery = '';
  searchResults: GameDTO[] = [];
  searchLoading = false;
  pickerError: string | null = null;

  private search$ = new Subject<string>();
  private removeKeyListener!: () => void;

  constructor(
    private favoriteGamesService: FavoriteGamesService,
    private rawgService: RawgService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    this.loadFavorites();

    if (!this.readonly) {
      this.setupSearch();
      this.removeKeyListener = this.renderer.listen('window', 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.pickerSlot !== null) this.closePicker();
      });
    }
  }

  // ========== LOAD ==========

  async loadFavorites() {
    try {
      this.loading = true;
      this.favorites = this.userId
        ? await this.favoriteGamesService.getAllByUserId(this.userId)
        : await this.favoriteGamesService.getAll();
    } catch {
      this.favorites = [];
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
          return this.rawgService.searchGames(query).pipe(catchError(() => of([])));
        }),
      )
      .subscribe((results) => {
        this.searchResults = (results as GameDTO[]).slice(0, 6);
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

  // ========== PICKER ==========

  openPicker(slot: number) {
    if (this.readonly) return;
    this.pickerSlot = slot;
    this.searchQuery = '';
    this.searchResults = [];
    this.pickerError = null;
    this.cdr.detectChanges();
  }

  closePicker() {
    this.pickerSlot = null;
    this.searchQuery = '';
    this.searchResults = [];
    this.cdr.detectChanges();
  }

  async selectGame(game: GameDTO) {
    if (this.pickerSlot === null) return;

    this.pickerError = null;

    const duplicate = this.favorites.find(
      (f) => f.game_id === game.id && f.position !== this.pickerSlot,
    );
    if (duplicate) {
      this.pickerError = 'Este juego ya está en tus favoritos';
      return;
    }

    try {
      const existing = this.favorites.find((f) => f.position === this.pickerSlot);
      if (existing) await this.favoriteGamesService.remove(existing.id);

      const added = await this.favoriteGamesService.add({
        game_id: game.id,
        game_name: game.name,
        game_cover: game.background_image ?? null,
        position: this.pickerSlot,
      });

      this.favorites = this.favorites
        .filter((f) => f.position !== this.pickerSlot)
        .concat(added)
        .sort((a, b) => a.position - b.position);

      this.closePicker();
    } catch (err: any) {
      this.pickerError = err.message ?? 'Error al guardar';
    } finally {
      this.cdr.detectChanges();
    }
  }

  async removeGame(favorite: FavoriteGame, event: Event) {
    if (this.readonly) return;
    event.stopPropagation();
    try {
      await this.favoriteGamesService.remove(favorite.id);
      this.favorites = this.favorites.filter((f) => f.id !== favorite.id);
      this.cdr.detectChanges();
    } catch {}
  }

  // ========== HELPERS ==========

  get slots(): (FavoriteGame | null)[] {
    return Array.from(
      { length: MAX_FAVORITES },
      (_, i) => this.favorites.find((f) => f.position === i + 1) ?? null,
    );
  }

  ngOnDestroy(): void {
    if (this.removeKeyListener) this.removeKeyListener();
  }
}
