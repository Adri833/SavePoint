import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PlaythroughService } from '../../../services/playtrough.service';
import { Playthrough } from '../../../models/playtrough.model';
import { AllPlatinumModal } from '../all-platinum-modal/all-platinum-modal';

interface PlatinumEntry {
  playthrough: Playthrough;
  gameName: string;
  gameCover: string | null;
}

@Component({
  selector: 'app-recent-platinum',
  imports: [CommonModule, AllPlatinumModal],
  templateUrl: './recent-platinum.html',
  styleUrl: './recent-platinum.scss',
})
export class RecentPlatinum implements OnInit {
  @Input() userId?: string;

  entries: PlatinumEntry[] = [];
  totalPlatinums = 0;
  loading = true;
  error: string | null = null;
  showModal = false;

  readonly skeletons = [1, 2, 3, 4];

  constructor(
    private playthroughService: PlaythroughService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    try {
      const [playthroughs, total] = await Promise.all([
        this.userId
          ? this.playthroughService.getRecentPlatinumsByUserId(this.userId, 6)
          : this.playthroughService.getRecentPlatinums(6),
        this.userId
          ? this.playthroughService.countPlatinumsByUserId(this.userId)
          : this.playthroughService.countPlatinums(),
      ]);

      this.totalPlatinums = total;

      if (playthroughs.length === 0) {
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      this.entries = playthroughs.map((p) => ({
        playthrough: p,
        gameName: p.game_name ?? `Game #${p.game_id}`,
        gameCover: p.game_background ?? null,
      }));
      this.loading = false;
      this.cdr.detectChanges();
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
    this.showModal = true;
  }

  animationDelay(i: number): string {
    return `${i * 60}ms`;
  }
}
