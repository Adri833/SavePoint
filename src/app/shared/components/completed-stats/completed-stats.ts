import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-completed-stats',
  imports: [],
  templateUrl: './completed-stats.html',
  styleUrl: './completed-stats.scss',
})
export class CompletedStats {
  @Input() completed = 0;
  @Input() abandoned = 0;
  @Input() online = 0;
  @Input() loading = false;

  animatedCompleted = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  get hasData(): boolean {
    return this.completed + this.abandoned + this.online > 0;
  }

  get totalConsidered(): number {
    return this.completed + this.abandoned + this.online;
  }

  get completionRate(): number {
    if (this.totalConsidered === 0) return 0;
    return Math.round((this.completed / this.totalConsidered) * 100);
  }

  get onlineRate(): number {
    if (this.totalConsidered === 0) return 0;
    return Math.round((this.online / this.totalConsidered) * 100);
  }

  get abandonedRate(): number {
    return 100 - this.completionRate - this.onlineRate;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['completed']) {
      this.animateNumber();
    }
  }

  private animateNumber(duration: number = 800) {
    const start = 0;
    const end = this.completed;
    const startTime = performance.now();

    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutQuad(progress);

      this.animatedCompleted = Math.floor(easedProgress * (end - start) + start);

      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}
