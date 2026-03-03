# AI Therapist Matcher

Backend service for managing therapists using FastAPI, PostgreSQL
(Docker), and SQLAlchemy.

------------------------------------------------------------------------

## Tech Stack

-   FastAPI
-   PostgreSQL 16 (Docker)
-   SQLAlchemy
-   pgAdmin (optional)

------------------------------------------------------------------------

## Project Setup

### 1. Clone the Repository

``` bash
git clone <your-repo-url>
cd pythonProject7
```

------------------------------------------------------------------------

### 2. Create Virtual Environment

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
pip install -r requirements.txt
```

------------------------------------------------------------------------

### 3. Start PostgreSQL (Docker)

Make sure Docker Desktop is running.

``` bash
docker compose up -d
```

This will start:

-   PostgreSQL on port 5432
-   Database: therapist_matcher
-   Username: postgres
-   Password: postgres

------------------------------------------------------------------------

### 4. Run the Backend Server

``` bash
uvicorn app.main:app --reload
```

Server URL: http://127.0.0.1:8000

Swagger: http://127.0.0.1:8000/docs

Health Check: http://127.0.0.1:8000/health

------------------------------------------------------------------------

## View the Database (pgAdmin)

Register a new server:

-   Host: localhost
-   Port: 5432
-   Database: therapist_matcher
-   Username: postgres
-   Password: postgres

To view data: Schemas → public → Tables → therapists → View/Edit Data →
All Rows

------------------------------------------------------------------------

## Stop the Project

Stop backend: CTRL + C

Stop Docker:

``` bash
docker compose down
```
