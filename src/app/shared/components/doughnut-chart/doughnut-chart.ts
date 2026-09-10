import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-doughnut-chart',
  imports: [CommonModule],
  templateUrl: './doughnut-chart.html',
  styleUrls: ['./doughnut-chart.scss'],
})
export class DoughnutChart implements AfterViewInit, OnDestroy {
  @ViewChild('doughnutCanvas') doughnutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartWrapper') chartWrapper!: ElementRef<HTMLDivElement>;

  @Input() loading = false;
  @Input() set games(value: { gameName: string; hours: number }[]) {
    this._games = value;
    if (value && value.length > 0) {
      this.handleDataChange();
      this.cdr.detectChanges();
    }
  }

  get games() {
    return this._games;
  }

  constructor(private cdr: ChangeDetectorRef) {}

  private _games: { gameName: string; hours: number }[] = [];
  private chart!: Chart;
  private resizeObserver!: ResizeObserver;
  private currentSize = 0;

  private handleDataChange() {
    if (this.chart) {
      this.updateChart();
    }
    // Si el chart no existe todavía, se creará cuando el ResizeObserver
    // detecte un tamaño válido en ngAfterViewInit
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.loading) return;

      const entry = entries[0];
      const { width, height } = entry.contentRect;

      // Ignorar si el tamaño no es válido o no ha cambiado significativamente
      const size = Math.min(width, height);
      if (size < 10) return;
      if (Math.abs(size - this.currentSize) < 1) return;

      this.currentSize = size;
      const canvas = this.doughnutCanvas?.nativeElement;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (this.chart) {
        this.chart.resize(width, height);
      } else {
        this.createChart(this._games);
        this.cdr.detectChanges();
      }
    });

    this.resizeObserver.observe(this.chartWrapper.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.chart?.destroy();
  }

  private createChart(games: { gameName: string; hours: number }[]) {
    if (this.chart) return;

    const wrapper = this.chartWrapper.nativeElement;
    const canvas = this.doughnutCanvas.nativeElement;
    const { width, height } = wrapper.getBoundingClientRect();

    if (width < 10 || height < 10) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const validGames = games.filter((g) => g.hours > 0).sort((a, b) => b.hours - a.hours);
    const hasData = validGames.length > 0;

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: hasData ? validGames.map((g) => g.gameName) : ['Sin datos'],
        datasets: [
          {
            data: hasData ? validGames.map((g) => g.hours) : [1],
            backgroundColor: hasData ? this.generateColors(validGames.length) : ['#2f2f2f'],
            borderWidth: 0,
            hoverOffset: hasData ? 4 : 0,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        cutout: '65%',
        layout: { padding: 10 },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: hasData,
            callbacks: {
              label: (context) => {
                const rawTotal = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const value = Number(context.raw);

                // Redondeo seguro para el porcentaje y las horas
                const percentage = rawTotal > 0 ? ((value / rawTotal) * 100).toFixed(1) : '0';
                const formattedValue = Math.round((value + Number.EPSILON) * 100) / 100;

                return `${context.label}: ${formattedValue}h (${percentage}%)`;
              },
            },
          },
        },
      },
      plugins: [
        {
          id: 'centerText',
          beforeDraw: (chart) => {
            const { width, height, ctx } = chart;
            const data = chart.data.datasets[0].data as number[];
            const labels = chart.data.labels as string[];
            const isEmpty = labels.length === 1 && labels[0] === 'Sin datos';
            const rawTotalHours = isEmpty ? 0 : data.reduce((a, b) => a + b, 0);
            const totalHours = Math.round((rawTotalHours + Number.EPSILON) * 100) / 100;
            const totalGames = isEmpty ? 0 : data.filter((d) => d > 0).length;

            ctx.save();

            const hoursFontSize = height / 14;
            ctx.font = `${hoursFontSize}px sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.fillStyle = totalGames > 0 ? '#ffffff' : '#777777';

            const hoursText = `${totalHours}h`;
            const hoursX = width / 2 - ctx.measureText(hoursText).width / 2;
            const hoursY = height / 2 - 20;
            ctx.fillText(hoursText, hoursX, hoursY);

            const gamesFontSize = height / 26;
            ctx.font = `${gamesFontSize}px sans-serif`;
            ctx.fillStyle = '#aaa';
            const gamesText = `${totalGames} ${totalGames === 1 ? 'juego' : 'juegos'}`;
            const gamesX = width / 2 - ctx.measureText(gamesText).width / 2;
            const gamesY = hoursY + 50;
            ctx.fillText(gamesText, gamesX, gamesY);

            ctx.restore();
          },
        },
      ],
    });
  }

  private updateChart() {
    if (!this.chart) return;
    const validGames = this._games.filter((g) => g.hours > 0).sort((a, b) => b.hours - a.hours);
    this.chart.data.labels = validGames.map((g) => g.gameName);
    this.chart.data.datasets[0].data = validGames.map((g) => g.hours);
    this.chart.data.datasets[0].backgroundColor = this.generateColors(validGames.length);
    this.chart.update();
  }

  private generateColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const hue = Math.round((360 / count) * i);
      colors.push(`hsl(${hue}, 70%, 55%)`);
    }
    return colors;
  }
}
