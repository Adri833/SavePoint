import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GamesService } from '../../../services/games.service';
import { GameDTO } from '../../../utils/game-mapper';
import { HorizontalScrollSection } from '../../../shared/components/horizontal-scroll-section/horizontal-scroll-section';
import { SocialIcon } from '../../../shared/components/social-icon/social-icon';
import { Navbar } from '../../../shared/components/navbar-landing/navbar';
import { Button } from '../../../shared/components/button/button';

@Component({
  standalone: true,
  selector: 'app-landing',
  imports: [CommonModule, Navbar, Button, HorizontalScrollSection, SocialIcon],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  trendingGames: GameDTO[] = [];
  upComingGames: GameDTO[] = [];
  thisWeekGames: GameDTO[] = [];

  constructor(
    private router: Router,
    private gamesService: GamesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.gamesService.getTrendingGames().subscribe((games) => {
      this.trendingGames = games;
      this.cdr.detectChanges();
    });

    this.gamesService.getUpComingGames().subscribe((games) => {
      this.upComingGames = games;
      this.cdr.detectChanges();
    });

    this.gamesService.getThisWeekGames().subscribe((games) => {
      this.thisWeekGames = games;
      this.cdr.detectChanges();
    });
  }

  get thisYearLabel(): string {
    return String(new Date().getFullYear());
  }
  
  get lastYearLabel(): string {
    return String(new Date().getFullYear() - 1);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
