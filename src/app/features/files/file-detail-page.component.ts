import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-detail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-detail-container">
      <h1 class="page-title">File Details</h1>
      <p>File detail view will be implemented in future iterations.</p>
    </div>
  `,
  styles: [`
    .file-detail-container {
      max-width: 100%;
    }

    .page-title {
      font-family: var(--font-heading);
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--primary-navy);
      margin-bottom: 0.5rem;
    }
  `]
})
export class FileDetailPageComponent {}