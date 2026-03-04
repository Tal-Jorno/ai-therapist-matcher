import os
import traceback
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.user import User
from app.models.match_session import MatchSession
from app.models.match_message import MatchMessage
from app.models.match_result import MatchResult
from app.schemas.match import (
    MatchMessageCreateRequest,
    MatchMessageResponse,
    MatchResultResponse,
    MatchSessionCreateRequest,
    MatchSessionResponse,
)

router = APIRouter(prefix="/match", tags=["match"])


def _get_n8n_webhook_url() -> str:
    url = "http://localhost:5678/webhook-test/http://localhost:5678/webhook-test/32e7d948-2eff-4c1c-bdd9-6ccf34c47f7f"
    if not url:
        raise RuntimeError("N8N_MATCH_WEBHOOK_URL is not set")
    return url


@router.post("/sessions", response_model=MatchSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(payload: MatchSessionCreateRequest, db: Session = Depends(get_db)):
    client = db.query(User).filter(User.id == payload.client_user_id).first()
    if not client or client.role != "CLIENT":
        raise HTTPException(status_code=404, detail="Client not found")

    session_obj = MatchSession(client_user_id=payload.client_user_id, status="OPEN", is_active=True)
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj


@router.post("/sessions/{session_id}/message", response_model=MatchMessageResponse, status_code=status.HTTP_201_CREATED)
def add_message(session_id: int, payload: MatchMessageCreateRequest, db: Session = Depends(get_db)):
    session_obj = db.query(MatchSession).filter(MatchSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Match session not found")

    user_msg = MatchMessage(session_id=session_id, role="user", content=payload.content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    try:
        webhook_url = _get_n8n_webhook_url()
        with httpx.Client(timeout=30.0) as client:
            r = client.post(
                webhook_url,
                json={
                    "session_id": session_id,
                    "client_user_id": session_obj.client_user_id,
                    "message": payload.content,
                },
            )
            r.raise_for_status()
            data: dict[str, Any] = r.json()
    except Exception as e:
        traceback.print_exc()
        session_obj.status = "ERROR"
        db.add(session_obj)
        db.commit()
        raise HTTPException(status_code=502, detail=f"n8n webhook failed: {type(e).__name__}")

    assistant_text = data.get("assistant_message", "")
    if assistant_text:
        asst_msg = MatchMessage(session_id=session_id, role="assistant", content=assistant_text)
        db.add(asst_msg)

    result_payload = data.get("result")
    if result_payload is not None:
        existing = db.query(MatchResult).filter(MatchResult.session_id == session_id).first()
        if existing:
            existing.payload = result_payload
            db.add(existing)
        else:
            db.add(MatchResult(session_id=session_id, payload=result_payload))
        session_obj.status = "COMPLETE"
        db.add(session_obj)

    db.commit()
    return user_msg


@router.get("/sessions/{session_id}/results", response_model=MatchResultResponse)
def get_results(session_id: int, db: Session = Depends(get_db)):
    session_obj = db.query(MatchSession).filter(MatchSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Match session not found")

    res = db.query(MatchResult).filter(MatchResult.session_id == session_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="No results yet")
    return {"session_id": res.session_id, "payload": res.payload, "created_at": res.created_at}