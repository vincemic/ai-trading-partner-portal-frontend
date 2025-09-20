export const environment = {
  production: true,
  apiBaseUrl: '/api',
  sseBaseUrl: '/api/events/stream',
  enableLogging: false,
  enableTelemetry: false,
  mockData: false,
  sseEnabled: true,
  pollingFallbackInterval: 60000, // 60 seconds
  maxConcurrentSseConnections: 3,
  sessionTokenKey: 'portalSessionToken'
};