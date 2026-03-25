import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { SidebarItemComponent } from '../sidebar-item/sidebar-item';
import { AuthService } from '../../../services/auth.service';
import { SocialIcon } from "../social-icon/social-icon";

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, SidebarItemComponent, RouterModule, SocialIcon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  collapsed = window.innerWidth < 768;

  toggle() {
    this.collapsed = !this.collapsed;
  }
}
