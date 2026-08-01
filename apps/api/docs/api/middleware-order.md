# Middleware Order

The application middleware order is intentional:

1. Request ID middleware assigns or preserves `x-request-id`.
2. Helmet adds security headers.
3. CORS applies cross-origin policy.
4. Compression enables response compression.
5. Express JSON parser reads JSON request bodies.
6. Cookie parser exposes signed and unsigned cookies.
7. Request logger records request ID, method, status, and response time.
8. Versioned routes handle `/api/v1/...` requests.
9. Not-found middleware converts unmatched routes into `NotFoundError`.
10. Error middleware normalizes failures into the standard error response.

The request ID is installed first so it is available to every later middleware
and is returned on successful and failed responses alike.
