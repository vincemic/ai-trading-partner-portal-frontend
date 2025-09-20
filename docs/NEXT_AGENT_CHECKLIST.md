# Next Agent Implementation Checklist

## 📋 Quick Reference for Continuing Development

### ✅ Foundation Complete (Do Not Modify)
- ✅ Project structure and Angular setup
- ✅ Core services (API, session, SSE)
- ✅ State management stores (signals-based)
- ✅ Authentication system and guards
- ✅ Basic page components with routing
- ✅ Point C design system and styling
- ✅ Build configuration and environment setup

### 🎯 Immediate Next Steps (Priority Order)

#### 1. **HIGH PRIORITY**: PGP Key Management Dialogs
**Files to Create:**
- `src/app/features/keys/dialogs/generate-key-dialog.component.ts`
- `src/app/features/keys/dialogs/upload-key-dialog.component.ts`
- `src/app/features/keys/dialogs/revoke-key-dialog.component.ts`

**Key Requirements:**
- Form validation with date ranges
- Private key security (show once, auto-clear)
- Integration with `KeysStore`
- Material Dialog components

#### 2. **HIGH PRIORITY**: SFTP Password Management
**Files to Create:**
- `src/app/features/sftp/dialogs/rotate-password-dialog.component.ts`

**Key Requirements:**
- Manual vs auto-generated password modes
- Password complexity validation
- One-time password display
- Integration with `SftpStore`

#### 3. **MEDIUM PRIORITY**: Dashboard Analytics
**Files to Create:**
- `src/app/features/dashboard/components/kpi-tiles.component.ts`
- `src/app/features/dashboard/components/file-counts-chart.component.ts`
- `src/app/features/dashboard/components/success-ratio-chart.component.ts`
- `src/app/features/dashboard/components/top-errors-table.component.ts`
- `src/app/features/dashboard/components/advanced-metrics-panel.component.ts`

**Key Requirements:**
- ECharts integration for time series and pie charts
- Real-time SSE updates
- Responsive design
- Lazy loading for advanced metrics

#### 4. **MEDIUM PRIORITY**: Enhanced File Management
**Files to Create:**
- `src/app/features/files/components/file-filters.component.ts`
- `src/app/features/files/components/file-table.component.ts`
- `src/app/features/files/components/file-detail-drawer.component.ts`

**Key Requirements:**
- Advanced filtering and search
- Sortable table with real-time updates
- Side drawer for file details
- Pagination enhancements

#### 5. **LOW PRIORITY**: Shared Components
**Files to Create:**
- `src/app/shared/components/status-badge.component.ts`
- `src/app/shared/components/pagination-controls.component.ts`
- `src/app/shared/components/copy-to-clipboard.component.ts`
- `src/app/shared/components/confirm-dialog.component.ts`
- `src/app/shared/components/loading-skeleton.component.ts`

## 🔧 Setup Commands for Next Agent

```bash
# Navigate to project directory
cd "C:\tmp\ai-trading-partner-portal-frontend\portal-frontend"

# Install chart dependencies (if not already installed)
npm install echarts ngx-echarts @angular/cdk

# Start development server for testing
npm start

# Build for production testing
npm run build
```

## 📁 Key Files for Reference

### Existing Foundation Files:
- `src/app/core/models/dto.models.ts` - All TypeScript interfaces
- `src/app/state/*.store.ts` - Signal-based stores
- `src/app/core/services/*.service.ts` - API services
- `src/styles.scss` - Complete design system
- `src/environments/*.ts` - Environment configuration

### Documentation Files:
- `IMPLEMENTATION_ROADMAP.md` - Detailed feature specifications
- `TECHNICAL_SPECS.md` - Code patterns and examples
- `README.md` - Project overview and setup

## 🎨 Design System Reference

### Colors (CSS Variables):
- `--primary-navy: #021B38` (headers, primary buttons)
- `--primary-blue-gray: #727B9C` (secondary text)
- `--accent-coral: #DE4843` (errors, alerts)
- `--success-green: #28A745`
- `--warning-orange: #FFC107`
- `--white: #FFFFFF`
- `--light-gray: #F8F9FA`

### Component Classes:
- `.btn-primary`, `.btn-secondary`, `.btn-danger` - Button styles
- `.form-input`, `.form-label`, `.form-error` - Form styles
- `.card`, `.kpi-card` - Container styles

## 🔐 Security Reminders

1. **Private Keys**: Never store in global state, auto-clear from memory
2. **Passwords**: One-time display, immediate clipboard clear
3. **Forms**: Client-side validation + server validation
4. **SSE**: Secure token handling in query params
5. **CSP**: Maintain Content Security Policy compliance

## 🧪 Testing Strategy

1. **Unit Tests**: Focus on stores and complex components
2. **Component Tests**: Test dialog workflows and form validation
3. **E2E Tests**: Critical user journeys (login → key generation → password rotation)
4. **Accessibility**: Test keyboard navigation and screen readers

## 📊 Performance Considerations

1. **Lazy Loading**: Chart libraries loaded on demand
2. **Virtual Scrolling**: For large data tables
3. **Memoization**: Use computed signals for expensive calculations
4. **Bundle Size**: Monitor with `npm run build` and check sizes

## 🚀 Integration Points

### Backend API Endpoints Expected:
- `POST /api/login` - Authentication
- `GET /api/keys` - List keys
- `POST /api/keys/generate` - Generate key pair
- `POST /api/keys/upload` - Upload public key
- `POST /api/keys/{id}/revoke` - Revoke key
- `POST /api/sftp/credential/rotate` - Rotate password
- `GET /api/dashboard/summary` - Dashboard KPIs
- `GET /api/events/stream` - SSE endpoint

### SSE Event Types:
- `file.created`, `file.statusChanged`
- `key.promoted`, `key.revoked`
- `dashboard.metricsTick`
- `sftp.connectionStatusChanged`

## ⚠️ Common Pitfalls to Avoid

1. **Property Initialization**: Use getters for store access in components
2. **Memory Leaks**: Clear subscriptions and sensitive data
3. **TypeScript Strict**: Handle nullable types properly
4. **Angular Signals**: Use computed() for derived values
5. **Material Design**: Follow established patterns for dialogs

## 📞 Support Resources

- **Angular Docs**: https://angular.dev
- **Material Design**: https://material.angular.io
- **ECharts**: https://echarts.apache.org/en/index.html
- **TypeScript**: https://www.typescriptlang.org/docs

## 🎯 Success Criteria

### For PGP Key Management:
- [ ] Generate dialog creates keys and displays private key once
- [ ] Upload dialog accepts and validates PGP format
- [ ] Revoke dialog shows confirmation and updates state
- [ ] Real-time key status updates via SSE

### For SFTP Management:
- [ ] Password rotation with manual/auto modes
- [ ] Generated password displayed once with copy functionality
- [ ] Form validation for password complexity

### For Dashboard:
- [ ] Real-time KPI updates
- [ ] Interactive charts with tooltips
- [ ] Advanced metrics panel loads on demand
- [ ] Responsive design works on mobile

### For File Management:
- [ ] Advanced filtering with date ranges
- [ ] Real-time status updates in table
- [ ] File detail drawer with complete metadata

---

**Note**: The foundation is solid and well-architected. Focus on implementing the dialog components first as they provide the most critical user functionality. All necessary patterns and examples are provided in the documentation files.