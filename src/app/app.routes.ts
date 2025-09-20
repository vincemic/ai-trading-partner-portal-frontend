import { Routes } from '@angular/router';
import { sessionGuard } from './core/guards/session.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then(m => m.LoginPageComponent),
    title: 'Login - Trading Partner Portal'
  },

  // Protected routes with layout
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [sessionGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent),
        title: 'Dashboard - Trading Partner Portal'
      },
      {
        path: 'keys',
        loadComponent: () => import('./features/keys/keys-page.component').then(m => m.KeysPageComponent),
        title: 'Keys - Trading Partner Portal'
      },
      {
        path: 'sftp',
        loadComponent: () => import('./features/sftp/sftp-credential-page.component').then(m => m.SftpCredentialPageComponent),
        title: 'SFTP - Trading Partner Portal'
      },
      {
        path: 'files',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/files/files-page.component').then(m => m.FilesPageComponent),
            title: 'Files - Trading Partner Portal'
          },
          {
            path: ':fileId',
            loadComponent: () => import('./features/files/file-detail-page.component').then(m => m.FileDetailPageComponent),
            title: 'File Details - Trading Partner Portal'
          }
        ]
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit-page.component').then(m => m.AuditPageComponent),
        canActivate: [roleGuard],
        data: { roles: ['InternalSupport'] },
        title: 'Audit - Trading Partner Portal'
      }
    ]
  },

  // Fallback
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - Trading Partner Portal'
  }
];
