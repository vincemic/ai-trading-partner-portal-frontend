# Server-Sent Events (SSE) Backend Implementation Requirements

## Overview

The Trading Partner Portal frontend expects a real-time Server-Sent Events (SSE) endpoint to provide live updates for dashboard metrics, file processing events, and system status changes. This document specifies the exact requirements for implementing the SSE endpoint on the backend.

## Endpoint Specification

### URL
```
GET /api/events/stream
```

### Authentication
- **Method**: Query parameter authentication
- **Parameter**: `token` (required)
- **Example**: `/api/events/stream?token=admin-session-token`
- **Validation**: Backend must validate the session token and return `401 Unauthorized` if invalid

### HTTP Response Headers (Required)
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Credentials: true
```

**Critical**: The `Content-Type: text/event-stream` header is mandatory for the browser's EventSource API to work properly.

## Event Format Specification

All events must follow the SSE format:
```
id: <unique_event_id>
event: <event_type>
data: <json_payload>

```

**Important**: Each event must end with two newlines (`\n\n`).

## Required Event Types

The frontend expects these specific event types:

### 1. Connection Confirmation
Send immediately when client connects:
```
id: 1
event: connection
data: {"status": "connected", "timestamp": "2025-09-21T10:00:00.000Z"}

```

### 2. Dashboard Metrics Updates
```
id: 2
event: dashboard.metricsTick
data: {"inboundFiles24h": 45, "outboundFiles24h": 38, "successRate": 94.2, "avgProcessingTime": 12.5, "openErrors": 3, "totalBytes24h": 15728640, "avgFileSizeBytes": 189456.3, "connectionSuccessRate24h": 98.1, "largeFileCount24h": 2, "timestamp": "2025-09-21T10:01:00.000Z"}

```

### 3. Throughput Updates
```
id: 3
event: throughput.tick
data: {"timestamp": "2025-09-21T10:02:00.000Z", "totalBytes": 2048576, "fileCount": 12, "avgFileSizeBytes": 170714.7}

```

### 4. File Processing Events
```
id: 4
event: file.created
data: {"fileId": "12345", "fileName": "order_20250921.edi", "status": "Processing", "timestamp": "2025-09-21T10:03:00.000Z"}

id: 5
event: file.statusChanged
data: {"fileId": "12345", "fileName": "order_20250921.edi", "status": "Completed", "timestamp": "2025-09-21T10:04:00.000Z"}

```

### 5. PGP Key Events
```
id: 6
event: key.promoted
data: {"keyId": "key-123", "partnerId": "11111111-1111-1111-1111-111111111111", "timestamp": "2025-09-21T10:05:00.000Z"}

id: 7
event: key.revoked
data: {"keyId": "key-456", "partnerId": "11111111-1111-1111-1111-111111111111", "reason": "Manual revocation", "timestamp": "2025-09-21T10:06:00.000Z"}

```

### 6. SFTP Connection Status
```
id: 8
event: sftp.connectionStatusChanged
data: {"partnerId": "11111111-1111-1111-1111-111111111111", "status": "Connected", "lastCheck": "2025-09-21T10:07:00.000Z"}

```

### 7. Alert Events
```
id: 9
event: sftp.failureBurstAlert
data: {"windowStart": "2025-09-21T08:00:00.000Z", "failureCount": 8, "partnerId": "11111111-1111-1111-1111-111111111111"}

id: 10
event: sftp.zeroFileWindowAlert
data: {"windowHours": 4, "inboundFiles": 0, "flagged": true, "partnerId": "11111111-1111-1111-1111-111111111111"}

```

## Connection Management

### Keep-Alive
- Send periodic heartbeat comments to keep connection alive:
```
: heartbeat - keeping connection alive

```

### Event IDs
- Use sequential or timestamp-based unique IDs
- Frontend may send `lastEventId` query parameter for reconnection
- Example: `/api/events/stream?token=admin-session-token&lastEventId=12345`

### Client Disconnection
- Handle client disconnections gracefully
- Clean up resources when client disconnects
- Log disconnection events for monitoring

### Error Handling
- Return appropriate HTTP status codes:
  - `401 Unauthorized` for invalid tokens
  - `403 Forbidden` for insufficient permissions
  - `500 Internal Server Error` for server issues

## Implementation Examples

### ASP.NET Core Example
```csharp
[HttpGet("/api/events/stream")]
public async Task<IActionResult> EventStream([FromQuery] string token, [FromQuery] string lastEventId = null)
{
    // Validate authentication token
    if (!await _authService.ValidateTokenAsync(token))
        return Unauthorized();

    // Set SSE headers
    Response.Headers.Add("Content-Type", "text/event-stream");
    Response.Headers.Add("Cache-Control", "no-cache");
    Response.Headers.Add("Connection", "keep-alive");
    Response.Headers.Add("Access-Control-Allow-Origin", "http://localhost:4200");
    Response.Headers.Add("Access-Control-Allow-Credentials", "true");

    var cancellationToken = HttpContext.RequestAborted;
    var eventId = 1;

    try
    {
        // Send connection confirmation
        await SendEventAsync("connection", 
            new { status = "connected", timestamp = DateTime.UtcNow }, 
            eventId++);

        // Main event loop
        while (!cancellationToken.IsCancellationRequested)
        {
            // Send dashboard metrics every 30 seconds
            await Task.Delay(30000, cancellationToken);
            
            var metrics = await _dashboardService.GetCurrentMetricsAsync();
            await SendEventAsync("dashboard.metricsTick", metrics, eventId++);
        }
    }
    catch (OperationCanceledException)
    {
        // Client disconnected
        _logger.LogInformation("SSE client disconnected");
    }

    return new EmptyResult();

    async Task SendEventAsync(string eventType, object data, int id)
    {
        await Response.WriteAsync($"id: {id}\n");
        await Response.WriteAsync($"event: {eventType}\n");
        await Response.WriteAsync($"data: {JsonSerializer.Serialize(data)}\n\n");
        await Response.Body.FlushAsync();
    }
}
```

### Node.js/Express Example
```javascript
app.get('/api/events/stream', async (req, res) => {
    const { token, lastEventId } = req.query;
    
    // Validate token
    if (!await validateToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Credentials': 'true'
    });

    let eventId = 1;

    // Send connection confirmation
    sendEvent('connection', { status: 'connected', timestamp: new Date().toISOString() }, eventId++);

    // Send periodic updates
    const interval = setInterval(async () => {
        const metrics = await getDashboardMetrics();
        sendEvent('dashboard.metricsTick', metrics, eventId++);
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(interval);
        console.log('SSE client disconnected');
    });

    function sendEvent(type, data, id) {
        res.write(`id: ${id}\n`);
        res.write(`event: ${type}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
});
```

## Testing the Implementation

### Manual Testing with curl
```bash
curl -N -H "Accept: text/event-stream" \
  "https://localhost:7096/api/events/stream?token=admin-session-token"
```

Expected output:
```
id: 1
event: connection
data: {"status":"connected","timestamp":"2025-09-21T10:00:00.000Z"}

id: 2
event: dashboard.metricsTick
data: {"inboundFiles24h":45,"outboundFiles24h":38,"successRate":94.2,"timestamp":"2025-09-21T10:01:00.000Z"}
```

### Frontend Integration Testing
Once implemented, the frontend will:
1. Show "Connecting" status initially
2. Transition to "Connected" when the connection is established
3. Display real-time updates in the dashboard
4. Handle reconnections automatically if the connection is lost

## Troubleshooting

### Common Issues
1. **"Connecting" never changes to "Connected"**
   - Check that `Content-Type: text/event-stream` header is set
   - Verify the endpoint returns HTTP 200
   - Ensure token authentication is working

2. **CORS errors**
   - Add proper CORS headers
   - Ensure `Access-Control-Allow-Origin` matches frontend URL

3. **Connection drops frequently**
   - Implement proper keep-alive mechanism
   - Send periodic heartbeat comments
   - Handle client reconnections with `lastEventId`

4. **Events not received**
   - Verify event format (must end with `\n\n`)
   - Check that event types match frontend expectations
   - Ensure JSON data is properly serialized

## Development Priority

For initial development, implement in this order:
1. Basic SSE endpoint with authentication
2. Connection confirmation event
3. Dashboard metrics updates (dashboard.metricsTick)
4. Additional event types as needed

This will allow the frontend to transition from "Connecting" to "Connected" and provide a foundation for real-time updates.