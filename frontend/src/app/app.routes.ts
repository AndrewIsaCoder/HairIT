import { Routes } from '@angular/router';
import { authGuard, ownerGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    title: 'HairIT — programări la saloane și frizerii',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage)
  },
  {
    path: 'saloane',
    title: 'Saloane — HairIT',
    loadComponent: () => import('./pages/salons/salons-page').then((m) => m.SalonsPage)
  },
  {
    path: 'salon/:slug',
    loadComponent: () => import('./pages/salon/salon-page').then((m) => m.SalonPage)
  },
  {
    path: 'autentificare',
    title: 'Autentificare — HairIT',
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage)
  },
  {
    path: 'inregistrare',
    title: 'Cont nou — HairIT',
    loadComponent: () => import('./pages/register/register-page').then((m) => m.RegisterPage)
  },
  {
    path: 'contul-meu',
    title: 'Contul meu — HairIT',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/account-page').then((m) => m.AccountPage)
  },
  {
    path: 'salon-nou',
    title: 'Adaugă-ți salonul — HairIT',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/new-salon/new-salon-page').then((m) => m.NewSalonPage)
  },
  {
    path: 'salonul-meu',
    title: 'Salonul meu — HairIT',
    canActivate: [ownerGuard],
    loadComponent: () => import('./pages/owner/owner-page').then((m) => m.OwnerPage)
  },
  {
    path: '**',
    title: 'Pagina nu există — HairIT',
    loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage)
  }
];
