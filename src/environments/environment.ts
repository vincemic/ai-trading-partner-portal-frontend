export const environment = {
  production: false,
  apiBaseUrl: '/api',
  sseBaseUrl: '/api/events/stream',
  enableLogging: true,
  enableTelemetry: false,
  mockData: false,
  sseEnabled: true, // Enabled - will fall back to mock SSE when backend not available
  pollingFallbackInterval: 60000, // 60 seconds
  maxConcurrentSseConnections: 3,
  sessionTokenKey: 'portalSessionToken'
};