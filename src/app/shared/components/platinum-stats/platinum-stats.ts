import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-platinum-stats',
  imports: [],
  templateUrl: './platinum-stats.html',
  styleUrl: './platinum-stats.scss',
})
export class PlatinumStats implements OnChanges {
  @Input() totalPlatinum: number = 0;
  @Input() loading: boolean = false;

  animatedValue = 0;

  constructor(private cdr: ChangeDetectorRef) {}
  get hasData(): boolean {
    return this.totalPlatinum > 0;
  }

  get glowIntensity(): number {
    if (!this.hasData) return 0;

    const maxGlow = 25;
    return Math.min(this.totalPlatinum * 2, maxGlow);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalPlatinum'] && !this.loading) {
      this.animateCounter(this.totalPlatinum);
    }
  }

  // Numero animado
  private animateCounter(target: number) {
    const duration = 800;
    const start = 0;
    const startTime = performance.now();

    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutQuad(progress);

      this.animatedValue = Math.floor(start + (target - start) * easedProgress);

      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.animatedValue = target;
      }
    };

    requestAnimationFrame(animate);
  }
}
