
# AI Therapist Matcher

Backend service for managing therapists using FastAPI, PostgreSQL (Docker), and SQLAlchemy.

------------------------------------------------------------------------

## Tech Stack

- FastAPI
- PostgreSQL 16 (Docker)
- SQLAlchemy
- pgAdmin
- Dozzle (Docker Logs UI)

------------------------------------------------------------------------

## 1. Clone the Repository

```bash
git clone https://github.com/Tal-Jorno/ai-therapist-matcher.git
cd ai-therapist-matcher
```

------------------------------------------------------------------------

## 2. Run Full System with Docker (Recommended)

Make sure Docker Desktop is running.

Build and start all services:

```bash
docker compose up -d --build
```

This starts:

- FastAPI Backend → http://localhost:8000
- Swagger UI → http://localhost:8000/docs
- PostgreSQL → Port 5432
- pgAdmin → http://localhost:5050
- Dozzle (Logs UI) → http://localhost:9999

------------------------------------------------------------------------

## Database Credentials

- Database: therapist_matcher
- Username: postgres
- Password: postgres

------------------------------------------------------------------------

## Stop the System

```bash
docker compose down
```

------------------------------------------------------------------------

## Updating the Application

### If you changed Python code (.py files):

```bash
docker compose restart api
```

No rebuild is required.

---

### If you changed requirements.txt:

```bash
docker compose up -d --build
```

---

### If you changed Dockerfile or docker-compose.yml:

```bash
docker compose up -d --build
```

---

### If something is broken:

```bash
docker compose down
docker compose up -d --build
```

------------------------------------------------------------------------

## View Database in pgAdmin

Open:
http://localhost:5050

Login:
- Email: admin@admin.com
- Password: admin

Register a new server with:

- Host: db
- Port: 5432
- Database: therapist_matcher
- Username: postgres
- Password: postgres

To view data:
Schemas → public → Tables → therapists → View/Edit Data → All Rows

------------------------------------------------------------------------

## Logs (Docker UI)

Open:
http://localhost:9999

Select container:

- therapist_api
- therapist_matcher_db
- therapist_pgadmin
- therapist_dozzle

------------------------------------------------------------------------

## Project Structure

app/

- api/
- db/
- models/
- schemas/
- logger_config.py
- main.py

------------------------------------------------------------------------

## Current Status

- API runs fully inside Docker
- Database connected and running
- therapists table exists
- POST /therapists works
- Data persists in PostgreSQL
- Swagger working
- Health endpoint working
- Logging configured
- Docker services running

------------------------------------------------------------------------
