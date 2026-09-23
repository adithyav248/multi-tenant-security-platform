# Multi-Tenant Security Management Platform

## Architecture & Security Model
1. **Multi-Tenancy:** Handled via logical separation using row-level `tenantId` columns. The `tenantId` is strictly extracted from the authenticated JWT server-side. Query parameters or client-supplied tenant identifiers are rejected.
2. **RBAC:** Managed through role-check middlewares (`ADMIN`, `MANAGER`, `USER`) preventing unauthorized operations regardless of UI controls.

## Answers to Engineering Questions

### 1. How would you scale this to 1,000 tenants / 1M users?
* **Database Partitioning & Sharding:** Implement table partitioning by `tenantId` or move large enterprise tenants to isolated database schemas/instances (multi-database multi-tenancy).
* **Connection Pooling:** Use PgBouncer or Prisma Accelerate to handle high concurrency.
* **Caching:** Cache tenant metadata, permissions, and dashboard aggregates in Redis with short TTLs and cache invalidation hooks on mutation.
* **Stateless API Scaling:** Deploy backend services horizontally behind an Application Load Balancer (ALB) across multiple availability zones.

### 2. How would you handle JWT revocation?
* **Short-lived Access Tokens + Refresh Tokens:** Issue 15-minute access tokens with rotating refresh tokens stored in a secure Redis cache or database table.
* **Token Blocklist (Revocation list):** Store revoked `jti` (JWT ID) or user session revocation timestamps (`tokenVersion` or `passwordChangedAt`) in Redis. During authentication middleware checks, compare the token's issued-at (`iat`) timestamp against `tokenVersion`.

### 3. How would you troubleshoot a production API returning many 500 errors?
1. **Telemetry & Log Aggregation:** Inspect centralized logs (Datadog/Elasticsearch/CloudWatch) filtering by HTTP status 500 and correlated `traceId`/`requestId`.
2. **Database Health:** Check connection pool saturation, deadlocks, and slow query spikes in the PostgreSQL performance insights.
3. **Reproduce & Isolate:** Check error stack traces for common failure modes (e.g., unhandled promise rejections, third-party API timeouts, or missing schema migrations).
4. **Immediate Mitigation:** If a bad deploy caused the issue, initiate a rollback; if load-related, enable circuit breakers and scale backend container instances.