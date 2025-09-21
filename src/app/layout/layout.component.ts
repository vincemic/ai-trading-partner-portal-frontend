import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AppSessionStore } from '../state/app-session.store';
import { LoadingIndicatorService } from '../core/services/loading-indicator.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout-container">
      <!-- Top Navigation -->
      <header class="navbar">
        <div class="navbar-content">
          <div class="navbar-brand">
            <img src="assets/logos/portal-logo-primary.svg" alt="PointC Trading Portal" class="portal-logo">
          </div>

          <nav class="nav-menu" role="navigation" aria-label="Main navigation">
            <a routerLink="/dashboard" 
               routerLinkActive="active" 
               class="nav-link"
               [attr.aria-current]="isActive('/dashboard') ? 'page' : null">
              Dashboard
            </a>
            <a routerLink="/keys" 
               routerLinkActive="active" 
               class="nav-link"
               [attr.aria-current]="isActive('/keys') ? 'page' : null">
              Keys
            </a>
            <a routerLink="/sftp" 
               routerLinkActive="active" 
               class="nav-link"
               [attr.aria-current]="isActive('/sftp') ? 'page' : null">
              SFTP
            </a>
            <a routerLink="/files" 
               routerLinkActive="active" 
               class="nav-link"
               [attr.aria-current]="isActive('/files') ? 'page' : null">
              Files
            </a>
            @if (showAuditLink()) {
              <a routerLink="/audit" 
                 routerLinkActive="active" 
                 class="nav-link"
                 [attr.aria-current]="isActive('/audit') ? 'page' : null">
                Audit
              </a>
            }
          </nav>

          <div class="navbar-actions">
            <div class="user-info">
              <div class="user-details">
                <span class="user-id">{{ userDisplayName() }}</span>
                <span class="user-role">{{ userRole() }}</span>
              </div>
              <div class="connection-status">
                @switch (connectionStatus()) {
                  @case ('connected') {
                    <span class="status-indicator connected" title="Real-time updates active">
                      <span class="status-dot"></span>
                      Live
                    </span>
                  }
                  @case ('connecting') {
                    <span class="status-indicator connecting" title="Connecting to real-time updates">
                      <span class="status-dot"></span>
                      Connecting
                    </span>
                  }
                  @case ('error') {
                    <span class="status-indicator error" title="Real-time updates unavailable">
                      <span class="status-dot"></span>
                      Offline
                    </span>
                  }
                  @default {
                    <span class="status-indicator disconnected" title="Real-time updates disconnected">
                      <span class="status-dot"></span>
                      Disconnected
                    </span>
                  }
                }
              </div>
            </div>
            <button 
              type="button" 
              class="btn-secondary logout-btn" 
              (click)="logout()"
              title="Sign out">
              Sign Out
            </button>
          </div>
        </div>

        <!-- Global loading indicator -->
        @if (isLoading()) {
          <div class="loading-bar">
            <div class="loading-progress"></div>
          </div>
        }
      </header>

      <!-- Main Content -->
      <main class="main-content" role="main">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <p class="footer-text">
            © 2025 Trading Partner Portal • 
            <a href="#" class="footer-link">Privacy Policy</a> • 
            <a href="#" class="footer-link">Terms of Service</a>
          </p>
          <p class="footer-version">Version 1.0.0</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--background-section);
    }

    .navbar {
      background: var(--white);
      border-bottom: 1px solid #E9ECEF;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
    }

    .navbar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 4rem;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
    }

    .portal-logo {
      width: 120px;
      height: auto;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      font-family: var(--font-ui);
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--medium-gray);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: var(--primary-navy);
      background: var(--light-gray);
    }

    .nav-link.active {
      color: var(--primary-navy);
      background: var(--background-section);
      font-weight: 600;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      text-align: right;
    }

    .user-id {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--dark-gray);
    }

    .user-role {
      font-family: var(--font-ui);
      font-size: 0.75rem;
      color: var(--primary-blue-gray);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .connection-status {
      display: flex;
      align-items: center;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-family: var(--font-ui);
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-indicator.connected {
      color: var(--success-green);
    }

    .status-indicator.connected .status-dot {
      background: var(--success-green);
    }

    .status-indicator.connecting {
      color: var(--warning-orange);
    }

    .status-indicator.connecting .status-dot {
      background: var(--warning-orange);
    }

    .status-indicator.error {
      color: var(--error-red);
    }

    .status-indicator.error .status-dot {
      background: var(--error-red);
    }

    .status-indicator.disconnected {
      color: var(--medium-gray);
    }

    .status-indicator.disconnected .status-dot {
      background: var(--medium-gray);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .logout-btn {
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
    }

    .loading-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(114, 123, 156, 0.1);
      overflow: hidden;
    }

    .loading-progress {
      height: 100%;
      background: var(--primary-blue-gray);
      width: 30%;
      animation: loading-slide 1.5s ease-in-out infinite;
    }

    @keyframes loading-slide {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(300%); }
      100% { transform: translateX(-100%); }
    }

    .main-content {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    .footer {
      background: var(--white);
      border-top: 1px solid #E9ECEF;
      padding: 1rem 0;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .footer-text {
      font-family: var(--font-ui);
      font-size: 0.875rem;
      color: var(--medium-gray);
      margin: 0;
    }

    .footer-link {
      color: var(--primary-blue-gray);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: var(--primary-navy);
    }

    .footer-version {
      font-family: var(--font-ui);
      font-size: 0.75rem;
      color: var(--primary-blue-gray);
      margin: 0;
    }

    /* Mobile styles */
    @media (max-width: 768px) {
      .navbar-content {
        padding: 0 1rem;
        height: auto;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .nav-menu {
        order: 3;
        width: 100%;
        justify-content: center;
        padding: 1rem 0;
        border-top: 1px solid #E9ECEF;
        margin-top: 1rem;
      }

      .navbar-actions {
        order: 2;
        gap: 0.5rem;
      }

      .user-details {
        display: none;
      }

      .main-content {
        padding: 1rem;
      }

      .footer-content {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
        padding: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .portal-logo {
        width: 100px;
      }

      .nav-link {
        padding: 0.5rem;
        font-size: 0.8rem;
      }
    }
  `]
})
export class LayoutComponent {
  private readonly currentUrl = signal('');

  constructor(
    private sessionStore: AppSessionStore,
    private loadingService: LoadingIndicatorService,
    private router: Router
  ) {
    // Initialize current URL
    this.currentUrl.set(this.router.url);
    
    // Update current URL on navigation
    this.router.events.subscribe(() => {
      this.currentUrl.set(this.router.url);
    });
  }

  get session() {
    return this.sessionStore.session;
  }

  get isLoading() {
    return this.loadingService.isLoading;
  }

  get connectionStatus() {
    return this.sessionStore.sseConnectionStatus;
  }

  readonly userDisplayName = computed(() => {
    const session = this.session();
    return session ? session.userId : '';
  });

  readonly userRole = computed(() => {
    const session = this.session();
    return session ? session.role : '';
  });

  readonly showAuditLink = computed(() => {
    const session = this.session();
    return session && session.role === 'InternalSupport';
  });

  isActive(path: string): boolean {
    const url = this.currentUrl();
    return url.startsWith(path);
  }

  logout(): void {
    this.sessionStore.logout();
  }
}