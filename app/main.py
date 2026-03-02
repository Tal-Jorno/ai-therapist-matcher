from fastapi import FastAPI
from app.db.base import Base
from sqlalchemy import text
from app.db.database import engine


Base.metadata.create_all(bind=engine)
app = FastAPI(title="AI Therapist Matcher")

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db-check")
def db_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"db_response": result.scalar()}

print("LOADED ROUTES:", [r.path for r in app.routes])

