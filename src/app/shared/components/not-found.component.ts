import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a routerLink="/dashboard" class="btn-primary">
          Return to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
    }

    .not-found-content {
      max-width: 400px;
    }

    .error-code {
      font-family: var(--font-heading);
      font-size: 6rem;
      font-weight: 700;
      color: var(--primary-blue-gray);
      line-height: 1;
      margin-bottom: 1rem;
    }

    .error-title {
      font-family: var(--font-heading);
      font-size: 2rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 1rem;
    }

    .error-message {
      font-family: var(--font-body);
      font-size: 1.125rem;
      color: var(--medium-gray);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    @media (max-width: 480px) {
      .error-code {
        font-size: 4rem;
      }

      .error-title {
        font-size: 1.5rem;
      }

      .error-message {
        font-size: 1rem;
      }
    }
  `]
})
export class NotFoundComponent {}