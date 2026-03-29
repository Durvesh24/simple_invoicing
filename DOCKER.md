# Docker Setup Guide

This guide explains how to run the Respawn Invoicing application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 1.29+)

## Quick Start

### 1. Start all services

```bash
docker-compose up -d
```

This will:
- Create and start a PostgreSQL database
- Build and start the FastAPI backend service
- Build and start the React frontend service with Nginx

### 2. Access the application

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:8000 (port 8000)
- **Database**: localhost:5432 (port 5432)

### 3. Seed initial data (optional)

```bash
docker-compose exec backend python seed_admin.py
```

This creates an admin user with:
- Email: `admin@respawn.dev`
- Password: `Admin@123`

## Development

### Running in development mode

For development with hot-reload:

```bash
docker-compose up -d
```

The backend container is already configured with `--reload` flag to enable hot-reload on code changes.

For frontend live reload, you can also run locally:

```bash
cd frontend
npm install
npm run dev
```

### Viewing logs

View logs from all services:
```bash
docker-compose logs -f
```

View logs from a specific service:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## Production Deployment

For production deployment, modify the `docker-compose.yml`:

1. **Backend changes**:
   - Remove `--reload` flag
   - Set strong `SECRET_KEY`
   - Use a reverse proxy (nginx/traefik)
   - Consider using `gunicorn` instead of uvicorn

2. **Frontend changes**:
   - Build is already optimized in the Dockerfile
   - Nginx is configured for production use
   - Static assets are cached for 1 year

3. **Database changes**:
   - Use managed PostgreSQL service (AWS RDS, Heroku, etc.)
   - Regular backups
   - Strong credentials

Example production update for backend:

```dockerfile
CMD ["gunicorn", "app_main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

## Common Commands

### Stop all services

```bash
docker-compose down
```

### Remove all services and volumes

```bash
docker-compose down -v
```

### Rebuild containers

```bash
docker-compose up -d --build
```

### Rebuild specific service

```bash
docker-compose up -d --build backend
```

### Execute command in container

```bash
docker-compose exec backend bash
docker-compose exec frontend sh
docker-compose exec db psql -U respawn_user -d respawn_invoicing
```

## Troubleshooting

### Database connection failed

Ensure the database service is healthy:
```bash
docker-compose ps
docker-compose logs db
```

Wait for database to be fully initialized (check healthcheck status).

### Backend failed to start

Check backend logs:
```bash
docker-compose logs backend
```

Common issues:
- Database not ready yet (wait a few seconds)
- Environment variables not set correctly
- Port 8000 already in use

### Frontend not loading

Check frontend logs:
```bash
docker-compose logs frontend
```

Ensure the nginx configuration is correct and backend is accessible.

### Port conflicts

If ports 80, 8000, or 5432 are already in use, modify the ports in `docker-compose.yml`:

```yaml
ports:
  - "8080:8000"  # Map 8080 on host to 8000 in container
```

## Environment Variables

Create a `.env` file in the project root to override defaults:

```env
# Database
DATABASE_URL=postgresql://respawn_user:respawn_password@db:5432/respawn_invoicing

# Backend
SECRET_KEY=your-very-secure-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend API
VITE_API_BASE_URL=http://localhost:8000/api
```

Then update `docker-compose.yml` to use the `.env` file:

```yaml
services:
  backend:
    env_file: .env
```

## Monitoring

### Check service health

```bash
docker-compose ps
```

### Check specific service health

```bash
docker inspect respawn_backend | grep -A 5 '"Health"'
```

### Monitor resource usage

```bash
docker stats
```

## Further Help

For more information, refer to:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Nginx Documentation](https://nginx.org/en/docs/)
