import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/login-page.component';
import { DocumentsPageComponent } from './features/documents/documents-page.component';
import { DocumentDetailComponent } from './features/documents/document-detail.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-page.component').then((m) => m.AdminPageComponent),
  },
  {
    path: 'documents',
    component: DocumentsPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'documents/:id',
    component: DocumentDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'documents',
  },
  {
    path: '**',
    redirectTo: 'documents',
  },
];
