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
    component: ResetPassword,
  },
  {
    path: 'auth/callback',
    component: AuthCallback,
  },

  // ========== HOME (autenticado) ==========
  {
    path: 'home',
    canActivate: [AuthGuard],
    component: HomeLayout,
    children: [
      {
        path: 'playthroughs',
        loadComponent: () =>
          import('./pages/guard/home/playthroughs/playtroughs').then((m) => m.Playthroughs),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/guard/home/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/guard/home/profile/profile').then((m) => m.ProfileComponent),
      },
      {
        path: 'friends',
        loadComponent: () => import('./pages/guard/home/friends/friends').then((m) => m.Friends),
      },
      {
        path: 'game/:id',
        loadComponent: () =>
          import('./pages/guard/home/game-detail/game-detail').then((m) => m.GameDetail),
      },

      // ========== PERFILES PÚBLICOS (dentro del layout autenticado) ==========
      {
        path: 'u/:username',
        loadComponent: () =>
          import('./pages/guard/home/user-profile/user-profile').then((m) => m.UserProfile),
      },
      {
        path: 'u/:username/biblioteca',
        loadComponent: () =>
          import('./pages/guard/home/user-playthroughs/user-playthroughs').then(
            (m) => m.Userplaythroughs,
          ),
      },
    ],
  },
];
