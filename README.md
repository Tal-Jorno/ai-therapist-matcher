# AI Therapist Matcher

Backend service for managing therapists using FastAPI, PostgreSQL
(Docker), and SQLAlchemy.

------------------------------------------------------------------------

## Tech Stack

-   FastAPI
-   PostgreSQL 16 (Docker)
-   SQLAlchemy
-   pgAdmin
-   Dozzle (Docker logs UI)

------------------------------------------------------------------------

## 1. Clone the Repository

``` bash
git clone https://github.com/Tal-Jorno/ai-therapist-matcher.git
cd ai-therapist-matcher
```

------------------------------------------------------------------------

## 2. Create Virtual Environment (Local Development)

``` bash
python -m venv .venv
```

Activate:

Windows:

``` bash
.venv\Scripts\activate
```

Mac/Linux:

``` bash
source .venv/bin/activate
```

Install dependencies:

``` bash
pip install -r app/requirements.txt
```

------------------------------------------------------------------------

## 3. Run with Docker (Database + pgAdmin + Logs UI)

Make sure Docker Desktop is running.

``` bash
docker compose up -d
```

This starts:

-   PostgreSQL → Port 5432
-   pgAdmin → http://localhost:5050
-   Dozzle (Logs UI) → http://localhost:9999

Database credentials:

-   Database: therapist_matcher
-   Username: postgres
-   Password: postgres

If you get a container name conflict:

``` bash
docker compose down
docker rm -f therapist_matcher_db therapist_pgadmin therapist_dozzle
docker compose up -d
```

To stop services:

``` bash
docker compose down
```

------------------------------------------------------------------------

## 4. Run the Backend Server

``` bash
uvicorn app.main:app --reload
```

Server: http://127.0.0.1:8000

Swagger: http://127.0.0.1:8000/docs

Health Check: http://127.0.0.1:8000/health

------------------------------------------------------------------------

## View Database in pgAdmin

Open: http://localhost:5050

Login: - Email: admin@admin.com - Password: admin

Register new server: - Host: localhost - Port: 5432 - Database:
therapist_matcher - Username: postgres - Password: postgres

To view data: Schemas → public → Tables → therapists → View/Edit Data →
All Rows

------------------------------------------------------------------------

## Logs (Docker UI)

Open: http://localhost:9999

Select container: - therapist_matcher_db - therapist_pgadmin -
therapist_dozzle

------------------------------------------------------------------------

## Project Structure

app/

-   api/
-   db/
-   models/
-   schemas/
-   logger_config.py
-   main.py

------------------------------------------------------------------------

## Current Status

-   Database connected and running
-   therapists table exists
-   POST /therapists works
-   Data persists in PostgreSQL
-   Swagger working
-   Health endpoint working
-   Logging configured
-   Docker services running

------------------------------------------------------------------------
