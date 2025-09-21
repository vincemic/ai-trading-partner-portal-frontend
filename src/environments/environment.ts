export const environment = {
  production: false,
  apiBaseUrl: '/api',
  sseBaseUrl: '/api/events/stream',
  enableLogging: true,
  enableTelemetry: false,
  mockData: false,
  sseEnabled: true,
  pollingFallbackInterval: 60000, // 60 seconds
  maxConcurrentSseConnections: 3,
  sessionTokenKey: 'portalSessionToken'
};