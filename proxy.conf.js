const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  '/api': createProxyMiddleware({
    target: 'https://localhost:7096',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      // For SSE endpoint, pass query param auth directly to backend
      // Backend now supports query parameter authentication natively
      if (req.url.includes('/events/stream') && req.url.includes('token=')) {
        console.log(`SSE request with query parameter authentication: ${req.url}`);
        // No conversion needed - pass through directly
      }
    }
  })
};