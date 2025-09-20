# PointC Trading Portal Frontend

A modern Angular application for the PointC EDI Trading Partner Self-Service Portal, built according to comprehensive specifications. This frontend implements the Point C design system and provides a secure, accessible interface for managing PGP keys, SFTP credentials, file transfers, and monitoring.

## Key Features

- 🔐 **Authentication & Security** - Session token auth, role-based access
- 📊 **Dashboard & Analytics** - Real-time KPIs, SSE updates
- 🔑 **PGP Key Management** - Upload, generate, rotate keys
- 🔗 **SFTP Credential Management** - Password rotation, metadata
- 📁 **File Management** - Browsing, monitoring, filtering
- 📋 **Audit Logging** - Comprehensive audit trail
- 🎨 **Point C Design System** - Responsive, accessible UI

## Technology Stack

- **Framework**: Angular (Latest LTS)
- **Language**: TypeScript (strict mode)
- **UI Library**: Angular Material + Custom Design System
- **State Management**: Angular Signals
- **Charts**: ECharts (ngx-echarts)
- **Styling**: SCSS with design tokens

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Angular CLI

### Installation
```bash
npm install
```

### Development Server

#### Using VS Code Tasks (Recommended)

This project includes VS Code tasks for streamlined development:

- **Start Server**: Use `dev-server-start` task or Ctrl+Shift+P → "Tasks: Run Task" → "dev-server-start"
- **Stop Server**: Use `dev-server-stop` task
- **Validate Server**: Use `dev-server-validate` task to check if server is running

#### Using npm Scripts

```bash
npm start
# Navigate to http://localhost:4200
```

### Testing

#### Playwright E2E Tests (VS Code Tasks)

- **Headless Tests**: Use `test-playwright-headless` task (default for CI)
- **Visual Debugging**: Use `test-playwright-headed` task
- **Step-by-Step Debugging**: Use `test-playwright-debug` task
- **Single Test File**: Use `test-single-spec` task

#### Using npm Test Scripts

```bash
npm run test:e2e          # Run all tests headless
npm run test:e2e:headed   # Run with browser visible
npm run test:e2e:debug    # Run with debugger
npm run test:e2e:login    # Run only login tests
```

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Documentation

### Project Documentation

- **[Technical Specifications](docs/TECHNICAL_SPECS.md)** - Detailed technical implementation specifications and file structure
- **[Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)** - Development roadmap and next steps for completing features
- **[Build Analysis](docs/BUILD_ANALYSIS.md)** - Build performance analysis and bundle size report
- **[Logo Integration](docs/LOGO_INTEGRATION.md)** - PointC branding and logo asset documentation
- **[Next Agent Checklist](docs/NEXT_AGENT_CHECKLIST.md)** - Quick reference checklist for continuing development

### Development Guidelines

- **[Copilot Instructions](.github/copilot-instructions.md)** - TypeScript, Angular, and development best practices

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
