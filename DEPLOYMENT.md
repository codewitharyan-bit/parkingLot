# Deployment & Operations Guide

## Quick Setup

```bash
npm install
npm run build
npm start
```

## Configuration

Create `.env`:
```bash
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=parking_lot
DB_USER=postgres
DB_PASSWORD=<secure>
```

## Docker

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src . && npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Docker Compose
```bash
docker-compose up -d
```

See `docker-compose.yml` in repo for full configuration

## Performance Tuning

### Database
```sql
ANALYZE parking_tickets;
REINDEX INDEX idx_tickets_combined;
```

### Application
```typescript
const db = new Database({
    pool: {
        min: 2,
        max: 20,
        idleTimeoutMillis: 30000
    }
});
```

## Monitoring

### Key Metrics
- Occupancy rate
- Average response time (<100ms target)
- Revenue per day
- Active vehicle count
- Database query time

### Tools
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **AlertManager**: Alerts to Slack/Email

## Logging

Use structured JSON logging:
```json
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO",
    "message": "Vehicle parked",
    "vehicleId": "uuid",
    "spot": "2-45"
}
```

## Backup & Recovery

### Daily Backup
```bash
# PostgreSQL
0 2 * * * pg_dump parking_lot > /backups/lot_$(date +\%Y\%m\%d).sql

# MongoDB
0 2 * * * mongodump --db parking_lot --out /backups/mongo_$(date +\%Y\%m\%d)
```

### Restore
```bash
psql parking_lot < /backups/lot_20240115.sql
mongorestore /backups/mongo_20240115
```

## Security Checklist

- [ ] SSL/TLS for database connections
- [ ] HTTPS only for APIs
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Regular security updates

## Scaling

### Horizontal
- Use load balancer for multiple API servers
- Database read replicas
- Redis cluster for caching

### Vertical
- Increase server CPU/RAM
- Upgrade database machine
- Increase connection pool size

## Troubleshooting

### High Response Times
1. Check database query performance: `EXPLAIN ANALYZE`
2. Verify cache hit rate
3. Check application logs for bottlenecks

### Database Connection Issues
1. Check connection pool status
2. Verify database server health
3. Check network/firewall rules

### High Memory Usage
1. Check for memory leaks (heap dumps)
2. Monitor cache size
3. Review data structures

## Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check system health
- [ ] Verify backups

### Weekly
- [ ] Review performance metrics
- [ ] Check disk usage
- [ ] Update monitoring thresholds

### Monthly
- [ ] Analyze trends
- [ ] Security audit
- [ ] Update documentation

---

**Last Updated**: June 2024
