export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7001/api',
  sseBaseUrl: 'https://localhost:7001/api/events/stream',
  enableLogging: true,
  enableTelemetry: false,
  mockData: true,
  sseEnabled: true,
  pollingFallbackInterval: 60000, // 60 seconds
  maxConcurrentSseConnections: 3,
  sessionTokenKey: 'portalSessionToken'
};