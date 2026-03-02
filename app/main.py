from fastapi import FastAPI

app = FastAPI(title="AI Therapist Matcher")

@app.get("/health")
def health():
    return {"status": "ok"}