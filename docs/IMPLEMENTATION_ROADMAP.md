# Implementation Roadmap - Next Steps

This document provides detailed guidance for completing the remaining features in the Trading Partner Portal frontend. The foundation is complete, and this roadmap will guide the next development iteration.

## 📋 Current Status

✅ **COMPLETED**
- Project structure and build configuration
- Core services, models, and interceptors
- Signal-based state management stores
- Authentication system and routing
- Basic page components with styling
- Point C design system implementation
- Production build configuration

🔄 **REMAINING TASKS**

## 1. Enhance PGP Key Management Features

### Overview
Build detailed dialog components for key operations with proper validation and security.

### Components to Create

#### 1.1 GenerateKeyDialog Component
**File**: `src/app/features/keys/dialogs/generate-key-dialog.component.ts`

**Requirements**:
- Form with validFrom, validTo (optional), makePrimary checkbox
- Date validation (validFrom <= validTo)
- RSA key size selection (2048, 4096 - default 4096)
- Progress indicator during generation
- Private key display with copy button (one-time only)
- Security warning about private key storage
- Auto-clear private key from memory on dialog close

**Key Implementation Details**:
```typescript
// Use reactive forms with validators
form = this.fb.group({
  validFrom: [new Date().toISOString().split('T')[0], Validators.required],
  validTo: [''],
  makePrimary: [false],
  keySize: [4096, [Validators.required, Validators.min(2048)]]
});

// Private key security handling
private privateKey = signal<string | null>(null);
showPrivateKey = computed(() => !!this.privateKey());

onDialogClose() {
  this.privateKey.set(null); // Clear from memory
  this.keysStore.clearLastGeneratedPrivateKey();
}
```

#### 1.2 UploadKeyDialog Component
**File**: `src/app/features/keys/dialogs/upload-key-dialog.component.ts`

**Requirements**:
- Textarea for ASCII-armored public key
- Client-side validation (PGP format check)
- File upload option (.asc, .txt, .pub files)
- Key fingerprint preview (calculated client-side if possible)
- Form validation with validFrom, validTo, makePrimary options
- Progress indicator during upload

**Key Implementation Details**:
```typescript
// PGP key format validation
validatePgpKey(control: AbstractControl) {
  const value = control.value;
  const pgpPattern = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*-----END PGP PUBLIC KEY BLOCK-----/;
  return pgpPattern.test(value) ? null : { invalidPgpFormat: true };
}

// File upload handling
onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.form.patchValue({ publicKeyArmored: e.target?.result });
    };
    reader.readAsText(file);
  }
}
```

#### 1.3 RevokeKeyDialog Component
**File**: `src/app/features/keys/dialogs/revoke-key-dialog.component.ts`

**Requirements**:
- Confirmation dialog with key details display
- Optional reason field
- Warning about irreversibility
- Impact explanation (if primary key)
- Auto-promotion logic explanation

#### 1.4 Enhanced KeysPageComponent
**Updates Needed**:
- Integrate dialog components
- Add proper action handlers
- Implement key promotion functionality
- Add loading states during operations
- Error handling with user-friendly messages

### Integration Points
- Connect to `KeysStore` methods
- Handle SSE events for real-time updates
- Implement proper error handling and user feedback

## 2. Enhance SFTP Credential Management

### Components to Create

#### 2.1 RotatePasswordDialog Component
**File**: `src/app/features/sftp/dialogs/rotate-password-dialog.component.ts`

**Requirements**:
- Mode selection: Manual vs Auto-generate
- Manual mode: Password input with complexity validation
- Auto mode: Display generated password once
- Password strength indicator
- Security warnings and best practices
- Copy to clipboard functionality

**Key Implementation Details**:
```typescript
// Password complexity validation
passwordComplexity = computed(() => {
  const password = this.form.get('newPassword')?.value || '';
  return {
    length: password.length >= 24,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)
  };
});

// Generated password handling
private generatedPassword = signal<string | null>(null);

onRotateComplete(response: RotatePasswordResponse) {
  if (response.password) {
    this.generatedPassword.set(response.password);
    // Auto-clear after 5 minutes
    setTimeout(() => this.generatedPassword.set(null), 5 * 60 * 1000);
  }
}
```

#### 2.2 Enhanced SftpCredentialPageComponent
**Updates Needed**:
- Connection endpoint information display
- Password rotation history table
- Security recommendations panel
- Integration testing utilities

### Additional Features
- Connection status indicator
- Last successful connection timestamp
- Connection performance metrics
- Troubleshooting guides

## 3. Build Dashboard Analytics Components

### Components to Create

#### 3.1 KpiTilesComponent
**File**: `src/app/features/dashboard/components/kpi-tiles.component.ts`

**Requirements**:
- Responsive grid layout (4 columns → 2 → 1)
- Real-time value updates via SSE
- Trend indicators (up/down arrows, percentages)
- Click-through to detailed views
- Loading skeletons
- Color-coded values based on thresholds

#### 3.2 FileCountsChartComponent
**File**: `src/app/features/dashboard/components/file-counts-chart.component.ts`

**Requirements**:
- ECharts integration for time series
- Inbound vs Outbound file counts
- 48-hour rolling window
- Real-time updates via SSE
- Responsive sizing
- Data point tooltips

**Key Implementation Details**:
```typescript
import { EChartsOption } from 'echarts';

chartOptions = computed<EChartsOption>(() => {
  const timeSeries = this.dashboardStore.timeSeries();
  
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Inbound', 'Outbound'] },
    xAxis: { 
      type: 'time',
      data: timeSeries?.points.map(p => p.timestamp) || []
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Inbound',
        type: 'line',
        data: timeSeries?.points.map(p => p.inboundCount) || []
      },
      {
        name: 'Outbound', 
        type: 'line',
        data: timeSeries?.points.map(p => p.outboundCount) || []
      }
    ]
  };
});
```

#### 3.3 SuccessRatioChartComponent
**File**: `src/app/features/dashboard/components/success-ratio-chart.component.ts`

**Requirements**:
- Pie/donut chart showing Success vs Failed vs Pending
- Animated transitions
- Center text with total count
- Legend with percentages

#### 3.4 TopErrorsTableComponent
**File**: `src/app/features/dashboard/components/top-errors-table.component.ts`

**Requirements**:
- Top 5 error categories
- Error counts and percentages
- Click-through to filtered files view
- Real-time updates

#### 3.5 AdvancedMetricsPanel (Collapsible)
**File**: `src/app/features/dashboard/components/advanced-metrics-panel.component.ts`

**Requirements**:
- Lazy loading when expanded
- Connection health chart
- Throughput metrics
- Large files list (top 10)
- Connection performance metrics
- Daily operations summary
- Failure burst alerts
- Zero file window status

### Integration Requirements
- ECharts library setup and configuration
- Responsive chart sizing
- SSE event handling for real-time updates
- Loading states and error handling
- Accessibility (chart alternatives for screen readers)

## 4. Enhance File Management Features

### Components to Create

#### 4.1 FileFiltersComponent
**File**: `src/app/features/files/components/file-filters.component.ts`

**Requirements**:
- Direction filter (Inbound/Outbound/All)
- Status filter (Success/Failed/Pending/Processing/All)
- Document type filter (dropdown with available types)
- Date range picker (from/to)
- Reset filters button
- Filter state persistence

#### 4.2 Enhanced FileTableComponent
**File**: `src/app/features/files/components/file-table.component.ts`

**Requirements**:
- Sortable columns
- Row selection for batch operations
- Click-through to detail view
- Real-time status updates via SSE
- Loading states for individual rows
- Responsive table (cards on mobile)

#### 4.3 FileDetailDrawer Component
**File**: `src/app/features/files/components/file-detail-drawer.component.ts`

**Requirements**:
- Slide-out panel design
- Complete file metadata display
- Processing timeline/stages
- Error details (if failed)
- Retry functionality
- Download links (if available)
- Related files/transactions

**Key Implementation Details**:
```typescript
// Drawer animation
@Component({
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
```

### Additional Features
- File preview capabilities (for supported formats)
- Export functionality
- Bulk operations
- Advanced search capabilities

## 5. Add Shared Components and Utilities

### Components to Create

#### 5.1 StatusBadgeComponent
**File**: `src/app/shared/components/status-badge.component.ts`

**Requirements**:
- Configurable colors and text
- Status-specific styling
- Accessibility support
- Animation on status changes

#### 5.2 PaginationControlsComponent
**File**: `src/app/shared/components/pagination-controls.component.ts`

**Requirements**:
- First/Previous/Next/Last buttons
- Page number input
- Page size selector
- Total items display
- Responsive design

#### 5.3 CopyToClipboardComponent
**File**: `src/app/shared/components/copy-to-clipboard.component.ts`

**Requirements**:
- Copy button with visual feedback
- Success/error states
- Accessibility support
- Security considerations for sensitive data

#### 5.4 ConfirmDialogComponent
**File**: `src/app/shared/components/confirm-dialog.component.ts`

**Requirements**:
- Reusable confirmation dialog
- Configurable title, message, buttons
- Danger/warning variants
- Keyboard navigation support

#### 5.5 LoadingSkeletonComponent
**File**: `src/app/shared/components/loading-skeleton.component.ts`

**Requirements**:
- Configurable shapes (lines, circles, rectangles)
- Animation effects
- Multiple skeleton patterns for different content types

### Utility Services

#### 5.6 ToastNotificationService
**File**: `src/app/shared/services/toast-notification.service.ts`

**Requirements**:
- Success/error/warning/info toast types
- Auto-dismiss timers
- Action buttons
- Positioning options
- Queue management

#### 5.7 ValidationService
**File**: `src/app/shared/services/validation.service.ts`

**Requirements**:
- Common validators (password complexity, PGP format, etc.)
- Error message mapping
- Custom validation functions

## 🎯 Implementation Priority

1. **High Priority**: PGP Key Management dialogs (critical security features)
2. **High Priority**: SFTP password rotation (essential functionality)
3. **Medium Priority**: Dashboard analytics (user experience enhancement)
4. **Medium Priority**: Enhanced file management (operational efficiency)
5. **Low Priority**: Shared components (can be implemented incrementally)

## 🔧 Technical Considerations

### Dependencies to Add
```json
{
  "echarts": "^5.4.0",
  "ngx-echarts": "^16.0.0",
  "@angular/cdk": "^17.0.0" // For overlay, drag-drop
}
```

### Testing Strategy
- Unit tests for all new components
- Integration tests for dialog workflows
- E2E tests for critical user journeys
- Accessibility testing for all components

### Performance Considerations
- Lazy loading for chart libraries
- Virtual scrolling for large file lists
- Debounced search inputs
- Memoized computed values

### Security Requirements
- Secure handling of private keys and passwords
- Input sanitization and validation
- CSP compliance for any external resources
- Audit logging for sensitive operations

## 📚 Documentation Updates Needed

1. Update component documentation with new features
2. Add API integration examples
3. Create user guide for key management workflows
4. Document security best practices
5. Add troubleshooting guides

---

This roadmap provides the foundation for completing the Trading Partner Portal frontend. Each section includes specific requirements, implementation details, and code examples to guide development.