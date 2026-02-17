# Agricultural Platform - Setup Complete! 🌱

## Quick Start

1. **Start Development Environment**
```bash
   ./start-dev.sh
```

2. **Check Service Status**
```bash
   docker compose ps
```

3. **View Logs**
```bash
   docker compose logs -f
```

4. **Stop All Services**
```bash
   ./stop-all.sh
```

## Services

- **PostgreSQL**: `localhost:5432`
  - Database: `agricultural_platform`
  - User: `postgres`
  - Password: `postgres123`

- **Redis**: `localhost:6379`

## Next Steps

1. Add your backend code to `backend/` directory
2. Add your frontend code to `frontend/` directory  
3. Create Dockerfiles for both services
4. Uncomment backend/frontend in `docker-compose.yml`
5. Run `docker compose up -d`

## Useful Commands
```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d postgres

# View logs
docker compose logs postgres
docker compose logs redis

# Execute commands in containers
docker compose exec postgres psql -U postgres -d agricultural_platform
docker compose exec redis redis-cli

# Restart services
docker compose restart postgres

# Remove everything (including data)
docker compose down -v
```

## Environment Variables

Check `.env` file for all configuration options.

## Database Connection
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d agricultural_platform

# Test Redis
redis-cli -h localhost ping
```

Happy coding! 🚀
