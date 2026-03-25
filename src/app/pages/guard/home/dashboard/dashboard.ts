import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { DashboardService } from '../../../../services/dashboard.service';
import { DoughnutChart } from '../../../../shared/components/doughnut-chart/doughnut-chart';
import { CompletedStats } from '../../../../shared/components/completed-stats/completed-stats';
import { PlatinumStats } from '../../../../shared/components/platinum-stats/platinum-stats';
import { YearSelector } from '../../../../shared/components/year-selector/year-selector';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-dashboard',
  imports: [DoughnutChart, CompletedStats, PlatinumStats, YearSelector],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  gamesData: { gameName: string; hours: number }[] = [];
  completedGames = 0;
  abandonedGames = 0;
  onlineGames = 0;
  platinumGames = 0;
  isLoading = true;

  availableYears: number[] = [];
  selectedYear = new Date().getFullYear();

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  async ngOnInit() {
    this.availableYears = await this.dashboardService.getAvailableYears();

    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }

    await this.loadDataForYear(this.selectedYear);
  }

  async onYearChange(year: number) {
    this.selectedYear = year;
    await this.loadDataForYear(year);
  }

  private async loadDataForYear(year: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const [stats, gamesData] = await Promise.all([
        this.dashboardService.getStatsByYear(year),
        this.dashboardService.getHoursByGameForYear(year),
      ]);

      this.ngZone.run(() => {
        this.completedGames = stats.completedCount;
        this.abandonedGames = stats.abandonedCount;
        this.onlineGames = stats.onlineCount;
        this.platinumGames = stats.totalPlatinum;
        this.gamesData = gamesData;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
