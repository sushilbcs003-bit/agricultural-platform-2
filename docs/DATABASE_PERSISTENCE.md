# Database Persistence Guide

## ✅ Your Database Data is Safe!

Your Docker Compose configuration uses **named volumes**, which means your database data **persists** across container restarts.

## What Happens During Different Operations

### ✅ Data PERSISTS (Safe Operations)

These operations **will NOT** clear your database:

1. **Normal container restart**
   ```bash
   docker compose restart postgres
   # or
   docker restart agricultural_postgres
   ```

2. **Stop and start containers**
   ```bash
   docker compose stop
   docker compose start
   # or
   ./stop-all.sh
   docker compose up -d
   ```

3. **Rebuild containers**
   ```bash
   docker compose up -d --build
   ```

4. **System reboot / Docker daemon restart**
   - The named volume persists on your filesystem

5. **Update Docker Compose configuration**
   - As long as the volume name stays the same, data persists

### ⚠️ Data is LOST (Dangerous Operations)

These operations **WILL** clear your database:

1. **Remove volumes explicitly**
   ```bash
   docker compose down -v          # ⚠️ REMOVES VOLUMES
   docker volume rm agricultural-platform_postgres_data
   ```

2. **Complete cleanup**
   ```bash
   docker compose down -v --remove-orphans
   ```

## Current Configuration

In your `docker-compose.yml`:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data  # Named volume - PERSISTS data
```

The `postgres_data` volume is a **named Docker volume** that stores data on your host filesystem. This volume:
- Survives container restarts
- Survives container removal (unless explicitly deleted)
- Is managed by Docker and stored in Docker's volume directory

## Volume Location

Docker stores named volumes on your system:
- **macOS/Windows (Docker Desktop)**: Inside the Docker VM
- **Linux**: `/var/lib/docker/volumes/agricultural-platform_postgres_data/`

## How to Verify Your Data is Safe

```bash
# Check if volume exists
docker volume ls | grep postgres_data

# Inspect the volume
docker volume inspect agricultural-platform_postgres_data

# Check volume usage
docker system df -v
```

## Safe Database Operations

### View your data (without clearing it)
```bash
# Connect to database
docker exec -it agricultural_postgres psql -U postgres -d agricultural_platform

# Run queries
SELECT COUNT(*) FROM users;
```

### Backup your data (recommended before risky operations)
```bash
# Create backup
docker exec agricultural_postgres pg_dump -U postgres agricultural_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup (if needed)
docker exec -i agricultural_postgres psql -U postgres agricultural_platform < backup_YYYYMMDD_HHMMSS.sql
```

### Clear database (only when you want to)
```bash
# Option 1: Clear all data (removes volume)
docker compose down -v
docker compose up -d

# Option 2: Clear only tables (keeps volume, clears data)
docker exec agricultural_postgres psql -U postgres -d agricultural_platform -c "TRUNCATE TABLE users, products, buyer_bids CASCADE;"
```

## Summary

- ✅ **Normal operations (restart, stop/start, rebuild)**: Data is SAFE
- ✅ **Your current setup**: Data PERSISTS automatically
- ⚠️ **Only explicit volume deletion**: Data is LOST
- 🔒 **Your `stop-all.sh` script**: Uses `docker compose down` (SAFE - no `-v` flag)

**You're all set!** Your database will not be cleared unless you explicitly request it with the `-v` flag.




