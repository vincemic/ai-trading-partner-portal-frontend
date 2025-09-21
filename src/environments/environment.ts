export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7218',
  sseBaseUrl: 'https://localhost:7218/api/events/stream',
  enableLogging: true,
  enableTelemetry: false,
  mockData: false,
  sseEnabled: true,
  pollingFallbackInterval: 60000, // 60 seconds
  maxConcurrentSseConnections: 3,
  sessionTokenKey: 'portalSessionToken'
};