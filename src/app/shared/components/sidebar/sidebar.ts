import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { SidebarItemComponent } from '../sidebar-item/sidebar-item';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, SidebarItemComponent, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  collapsed = window.innerWidth < 768;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  toggle() {
    this.collapsed = !this.collapsed;
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
