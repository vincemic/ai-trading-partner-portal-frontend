# Technical Implementation Specifications

## File Structure for Remaining Components

```
src/app/
├── features/
│   ├── keys/
│   │   ├── dialogs/
│   │   │   ├── generate-key-dialog.component.ts
│   │   │   ├── upload-key-dialog.component.ts
│   │   │   └── revoke-key-dialog.component.ts
│   │   └── keys-page.component.ts (enhance existing)
│   ├── sftp/
│   │   ├── dialogs/
│   │   │   └── rotate-password-dialog.component.ts
│   │   └── sftp-credential-page.component.ts (enhance existing)
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── kpi-tiles.component.ts
│   │   │   ├── file-counts-chart.component.ts
│   │   │   ├── success-ratio-chart.component.ts
│   │   │   ├── top-errors-table.component.ts
│   │   │   └── advanced-metrics-panel.component.ts
│   │   └── dashboard-page.component.ts (enhance existing)
│   ├── files/
│   │   ├── components/
│   │   │   ├── file-filters.component.ts
│   │   │   ├── file-table.component.ts
│   │   │   └── file-detail-drawer.component.ts
│   │   └── files-page.component.ts (enhance existing)
│   └── audit/
│       ├── components/
│       │   └── audit-filters.component.ts
│       └── audit-page.component.ts (enhance existing)
├── shared/
│   ├── components/
│   │   ├── status-badge.component.ts
│   │   ├── pagination-controls.component.ts
│   │   ├── copy-to-clipboard.component.ts
│   │   ├── confirm-dialog.component.ts
│   │   └── loading-skeleton.component.ts
│   └── services/
│       ├── toast-notification.service.ts
│       └── validation.service.ts
└── app.routes.ts (update with new routes)
```

## Dependencies to Install

```bash
npm install echarts ngx-echarts
npm install @angular/cdk  # For overlays and advanced UI
npm install @angular/material  # Already installed but ensure latest
```

## Key Implementation Patterns

### 1. Dialog Component Pattern

All dialog components should follow this structure:

```typescript
@Component({
  selector: 'app-[feature]-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ title }}</h2>
      <div mat-dialog-content>
        <!-- Form content -->
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="form.invalid || loading()">
          {{ submitText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { min-width: 400px; }
    mat-dialog-actions { margin-top: 1rem; }
  `]
})
export class ExampleDialog {
  @Inject(MAT_DIALOG_DATA) public data: any,
  constructor(
    private dialogRef: MatDialogRef<ExampleDialog>,
    private fb: FormBuilder
  ) {}
}
```

### 2. Chart Component Pattern

All chart components should use this structure:

```typescript
@Component({
  selector: 'app-[feature]-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  template: `
    <div class="chart-container">
      <h3 class="chart-title">{{ title }}</h3>
      @if (loading()) {
        <div class="chart-skeleton"></div>
      } @else {
        <div echarts [options]="chartOptions()" class="chart"></div>
      }
    </div>
  `,
  styles: [`
    .chart-container { 
      background: var(--white);
      border-radius: 0.5rem;
      padding: 1.5rem;
      border: 1px solid #E9ECEF;
    }
    .chart { height: 300px; }
    .chart-skeleton { 
      height: 300px; 
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      animation: loading 1.5s infinite;
    }
  `]
})
export class ExampleChartComponent {
  @Input() title = '';
  @Input() data: any[] = [];
  
  readonly loading = input(false);
  readonly chartOptions = computed(() => this.buildChartOptions());
}
```

### 3. Store Integration Pattern

Components should access stores through getters:

```typescript
export class ExampleComponent {
  constructor(private store: ExampleStore) {}
  
  // Expose store signals as getters
  get loading() { return this.store.loading; }
  get error() { return this.store.error; }
  get data() { return this.store.data; }
  
  // Actions
  async loadData() {
    await this.store.load();
  }
  
  async handleAction(payload: any) {
    try {
      await this.store.performAction(payload);
      // Show success message
    } catch (error) {
      // Handle error
    }
  }
}
```

## Security Implementation Guidelines

### Private Key Handling

```typescript
export class GenerateKeyDialog {
  private readonly privateKey = signal<string | null>(null);
  private readonly keyVisible = signal(false);
  
  readonly showPrivateKey = computed(() => this.keyVisible() && !!this.privateKey());
  
  async onGenerate() {
    try {
      const response = await this.keysStore.generate(this.form.value);
      this.privateKey.set(response.privateKeyArmored);
      
      // Auto-clear after 10 minutes
      setTimeout(() => this.clearPrivateKey(), 10 * 60 * 1000);
    } catch (error) {
      // Handle error
    }
  }
  
  clearPrivateKey() {
    this.privateKey.set(null);
    this.keyVisible.set(false);
  }
  
  onDialogClose() {
    this.clearPrivateKey();
    this.keysStore.clearLastGeneratedPrivateKey();
  }
}
```

### Password Handling

```typescript
export class RotatePasswordDialog {
  private readonly generatedPassword = signal<string | null>(null);
  private readonly passwordVisible = signal(false);
  
  async onRotate() {
    try {
      const response = await this.sftpStore.rotate(this.form.value);
      if (response.password) {
        this.generatedPassword.set(response.password);
        this.passwordVisible.set(true);
        
        // Auto-clear after 5 minutes
        setTimeout(() => this.clearPassword(), 5 * 60 * 1000);
      }
    } catch (error) {
      // Handle error
    }
  }
  
  clearPassword() {
    this.generatedPassword.set(null);
    this.passwordVisible.set(false);
  }
  
  copyToClipboard() {
    const password = this.generatedPassword();
    if (password) {
      navigator.clipboard.writeText(password);
      // Show success toast
    }
  }
}
```

## Form Validation Patterns

### Custom Validators

```typescript
export class CustomValidators {
  static pgpPublicKey(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const pgpPattern = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*-----END PGP PUBLIC KEY BLOCK-----/;
    return pgpPattern.test(value) ? null : { invalidPgpFormat: true };
  }
  
  static passwordComplexity(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const errors: any = {};
    
    if (value.length < 24) errors.minLength = true;
    if (!/[A-Z]/.test(value)) errors.requiresUppercase = true;
    if (!/[a-z]/.test(value)) errors.requiresLowercase = true;
    if (!/\d/.test(value)) errors.requiresNumber = true;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(value)) errors.requiresSpecial = true;
    
    return Object.keys(errors).length ? errors : null;
  }
  
  static dateRange(fromField: string, toField: string) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const from = formGroup.get(fromField)?.value;
      const to = formGroup.get(toField)?.value;
      
      if (from && to && new Date(from) > new Date(to)) {
        return { dateRange: true };
      }
      
      return null;
    };
  }
}
```

## Chart Configuration Examples

### File Counts Time Series

```typescript
buildFileCountsChart(): EChartsOption {
  const timeSeries = this.dashboardStore.timeSeries();
  const points = timeSeries?.points || [];
  
  return {
    title: { text: 'File Transfers (48h)', left: 'center' },
    tooltip: { 
      trigger: 'axis',
      formatter: (params: any[]) => {
        const time = new Date(params[0].name).toLocaleString();
        return `${time}<br/>Inbound: ${params[0].value}<br/>Outbound: ${params[1].value}`;
      }
    },
    legend: { 
      data: ['Inbound', 'Outbound'],
      bottom: 0
    },
    grid: { 
      top: 60, 
      bottom: 60, 
      left: 60, 
      right: 40 
    },
    xAxis: {
      type: 'time',
      axisLabel: { 
        formatter: '{HH}:{mm}',
        rotate: 45
      }
    },
    yAxis: { 
      type: 'value',
      name: 'File Count'
    },
    series: [
      {
        name: 'Inbound',
        type: 'line',
        smooth: true,
        data: points.map(p => [p.timestamp, p.inboundCount]),
        itemStyle: { color: '#17A2B8' }
      },
      {
        name: 'Outbound',
        type: 'line', 
        smooth: true,
        data: points.map(p => [p.timestamp, p.outboundCount]),
        itemStyle: { color: '#727B9C' }
      }
    ]
  };
}
```

### Success Ratio Pie Chart

```typescript
buildSuccessRatioChart(): EChartsOption {
  const summary = this.dashboardStore.summary();
  if (!summary) return {};
  
  const total = summary.inboundFiles24h + summary.outboundFiles24h;
  const successful = Math.round(total * summary.successRatePct / 100);
  const failed = summary.openErrors;
  const pending = total - successful - failed;
  
  return {
    title: { 
      text: 'Success Rate',
      subtext: `${summary.successRatePct.toFixed(1)}%`,
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
      subtextStyle: { fontSize: 24, fontWeight: 'bold', color: '#28A745' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['Success', 'Failed', 'Pending']
    },
    series: [
      {
        name: 'File Status',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '60%'],
        data: [
          { value: successful, name: 'Success', itemStyle: { color: '#28A745' } },
          { value: failed, name: 'Failed', itemStyle: { color: '#DE4843' } },
          { value: pending, name: 'Pending', itemStyle: { color: '#FFC107' } }
        ]
      }
    ]
  };
}
```

## Testing Specifications

### Component Test Template

```typescript
describe('ExampleComponent', () => {
  let component: ExampleComponent;
  let fixture: ComponentFixture<ExampleComponent>;
  let mockStore: jasmine.SpyObj<ExampleStore>;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('ExampleStore', ['load', 'performAction']);
    
    await TestBed.configureTestingModule({
      imports: [ExampleComponent],
      providers: [
        { provide: ExampleStore, useValue: storeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;
    mockStore = TestBed.inject(ExampleStore) as jasmine.SpyObj<ExampleStore>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', async () => {
    await component.ngOnInit();
    expect(mockStore.load).toHaveBeenCalled();
  });
});
```

### Dialog Test Template

```typescript
describe('ExampleDialog', () => {
  let component: ExampleDialog;
  let fixture: ComponentFixture<ExampleDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ExampleDialog>>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    
    await TestBed.configureTestingModule({
      imports: [ExampleDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleDialog);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ExampleDialog>>;
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
```

## Performance Optimization Guidelines

1. **Lazy Loading**: Use dynamic imports for chart libraries
2. **Virtual Scrolling**: For large file lists (>100 items)
3. **OnPush Strategy**: For chart components to reduce change detection
4. **Memoization**: Cache expensive calculations in computed signals
5. **Bundle Splitting**: Separate chart components into their own chunk

## Accessibility Requirements

1. **ARIA Labels**: All interactive elements must have descriptive labels
2. **Keyboard Navigation**: Tab order, Enter/Space activation
3. **Screen Reader Support**: Use semantic HTML and ARIA roles
4. **High Contrast**: Support for high contrast themes
5. **Focus Management**: Proper focus trapping in dialogs

## Error Handling Standards

1. **User-Friendly Messages**: Map technical errors to user-friendly text
2. **Retry Mechanisms**: For transient failures
3. **Fallback UI**: Graceful degradation when features unavailable
4. **Logging**: Structured error logging with context
5. **Toast Notifications**: Consistent error/success messaging

This technical specification provides the detailed implementation patterns and standards needed to complete the remaining features efficiently and consistently.