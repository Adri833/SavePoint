import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { Landing } from './pages/public/landing/landing';
import { Login } from './pages/public/login/login';
import { Register } from './pages/public/register/register';
import { HomeLayout } from './pages/guard/home/home-layout/home-layout';
import { AuthCallback } from './shared/components/auth-callback/auth-callback';
import { GuestGuard } from './guards/guest-guard';
import { ResetPassword } from './pages/public/reset-password/reset-password';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
  {
    path: '',
    component: Landing,
  },
  {
    path: 'login',
    canActivate: [GuestGuard],
    component: Login,
  },
  {
    path: 'register',
    canActivate: [GuestGuard],
    component: Register,
  },
  { 
    path: 'reset-password',
    component: ResetPassword 
  },
  { path: 'auth/callback',
    component: AuthCallback,
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    component: HomeLayout,
    children: [
      {
        path: 'biblioteca',
        loadComponent: () =>
          import('./pages/guard/home/playthroughs/playtroughs').then((m) => m.Playthroughs),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/guard/home/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'game/:id',
        loadComponent: () =>
          import('./pages/guard/home/game-detail/game-detail').then((m) => m.GameDetail),
      },
    ],
  },
];
