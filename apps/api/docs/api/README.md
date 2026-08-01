# AetherMind API Documentation

This directory is reserved for API documentation and future OpenAPI
specifications.

## Current API

### Health

```http
GET /api/v1/health
```

The endpoint returns the standard success response envelope:

```json
{
  "success": true,
  "message": "Health check successful",
  "data": {
    "status": "ok",
    "service": "aethermind-api",
    "version": "1.0.0"
  }
}
```

The request ID is returned in the `x-request-id` response header.
