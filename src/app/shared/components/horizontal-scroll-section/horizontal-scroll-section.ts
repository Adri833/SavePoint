import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ScrollItem {
  name: string | null;
  background_image: string | null;
}

@Component({
  selector: 'app-horizontal-scroll-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horizontal-scroll-section.html',
  styleUrl: './horizontal-scroll-section.scss',
})
export class HorizontalScrollSection implements AfterViewInit, OnChanges {
  @Input() title: string = '';
  @Input() items: ScrollItem[] = [];

  @Output() itemClick = new EventEmitter<ScrollItem>();

  showLeftButton = false;
  showRightButton = false;
  skeletonItems = Array(8).fill(0);

  private observer!: IntersectionObserver;
  private animationTriggered = false;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('section') section!: ElementRef<HTMLElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.observeSection();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']?.currentValue?.length > 0) {
      setTimeout(() => {
        this.attachScrollListener();
        this.triggerAnimationIfVisible();
      }, 50);
    }
  }

  scrollLeft() {
    this.scrollContainer.nativeElement.scrollBy({ left: -920, behavior: 'smooth' });
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollBy({ left: 920, behavior: 'smooth' });
  }

  private attachScrollListener() {
    if (!this.scrollContainer) return;
    const container = this.scrollContainer.nativeElement;
    container.addEventListener('scroll', () => this.updateScrollButtons());
    this.updateScrollButtons();
  }

  private updateScrollButtons() {
    const container = this.scrollContainer.nativeElement;
    this.showLeftButton = container.scrollLeft > 0;
    this.showRightButton =
      container.scrollWidth > container.clientWidth &&
      container.scrollLeft < container.scrollWidth - container.clientWidth;
    this.cdr.detectChanges();
  }

  private observeSection() {
    const el = this.section.nativeElement;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.animationTriggered) {
          this.triggerAnimation();
        }
      },
      { threshold: 0.1 },
    );

    this.observer.observe(el);
  }

  private triggerAnimationIfVisible() {
    if (this.animationTriggered) return;

    const el = this.section.nativeElement;
    const rect = el.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible) {
      this.triggerAnimation();
    }
  }

  private triggerAnimation() {
    this.animationTriggered = true;
    this.section.nativeElement.classList.add('is-visible');
    this.observer?.disconnect();
  }
}
