You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Development Workflow

- Always use VS Code tasks for server management and testing operations
- Use `dev-server-start` task to start the development server
- Use `dev-server-stop` task to stop any running servers
- Use `dev-server-validate` task to check if the server is running
- Use `test-playwright-headless` for running tests in CI/headless mode
- Use `test-playwright-headed` for visual test debugging
- Use `test-playwright-debug` for step-by-step test debugging
- Use `test-single-spec` for running individual test files

## Testing Best Practices

### Playwright E2E Tests
- Always run Playwright tests headless by default (`test-playwright-headless` task)
- Use inline reporting (`--reporter=list`) for immediate feedback
- Only use headed mode (`test-playwright-headed` task) for debugging purposes
- Use the debug mode (`test-playwright-debug` task) for step-by-step debugging
- Ensure tests run efficiently in CI/CD environments
- Validate server is running before executing tests (tasks handle this automatically)

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Testing

### Playwright E2E Tests
- Always run Playwright tests headless by default
- Use inline reporting (`--reporter=list`) for immediate feedback
- Only use headed mode for debugging purposes
- Ensure tests run efficiently in CI/CD environments
