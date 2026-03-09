# Supply Chain Operations & Control Platform

A comprehensive end-to-end platform coordinating supply-chain operations across suppliers, kitchens, drivers, and consumers.

This is a **Monorepo** containing both the React (Vite) frontend and the FastAPI backend.

## Structure

- `/frontend`: React application using Vite and Tailwind CSS.
- `/backend`: Python FastAPI application connected to PostgreSQL.

## Getting Started (Local Development)

We use a unified `package.json` at the root directory to manage local development tasks more effectively.

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (Local or via Docker)

### 1. Installation

From the root directory, run:
```bash
npm install
npm run install:all
```
This will install `concurrently` at the root, setup a Python venv in `/backend`, and install frontend dependencies.

> Note: Ensure your `backend/.env` is configured correctly for your local PostgreSQL database (`DATABASE_URL=postgresql://postgres:Ash@6464@localhost:5432/aggregator_db`).

### 2. Running Both Frontend and Backend

You can run both the Vite frontend and FastAPI backend concurrently with a single command:
```bash
npm run dev
```
Alternatively, you can run them separately using `npm run dev:frontend` and `npm run dev:backend`.

## Getting Started (Docker Compose)

The project includes a unified `docker-compose.yml` at the root that manages the Database, Backend, and Frontend without needing individual Dockerfiles scattered throughout the application.

```bash
# Start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

The services will be available at:
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`
- Database: `localhost:5432`
