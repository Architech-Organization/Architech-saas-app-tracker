from datetime import datetime, timedelta, timezone
from typing import List
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password
from app.models.models import User, InviteToken
from app.schemas.schemas import UserOut

router = APIRouter(prefix="/users", tags=["users"])

class InviteCreate(BaseModel):
    email: EmailStr
    role: str = "viewer"

class InviteAccept(BaseModel):
    token: str
    name: str
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class ProfileUpdate(BaseModel):
    name: str

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

@router.patch("/me", response_model=UserOut)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.name = payload.name
    db.commit()
    db.refresh(user)
    return user

@router.post("/me/password")
def change_password(payload: PasswordChange, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    import bcrypt
    if not bcrypt.checkpw(payload.current_password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).all()

@router.patch("/{user_id}/role")
def update_role(user_id: int, role: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if role not in ["admin", "editor", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"message": f"Role updated to {role}"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current: User = Depends(require_admin)):
    if current.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@router.post("/invite")
def invite_user(payload: InviteCreate, db: Session = Depends(get_db), current: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    token = secrets.token_urlsafe(32)
    invite = InviteToken(
        token=token,
        email=payload.email,
        role=payload.role,
        invited_by=current.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(invite)
    db.commit()
    return {"invite_token": token, "email": payload.email, "role": payload.role,
            "expires_in": "7 days",
            "invite_link": f"/register?token={token}"}

@router.post("/invite/accept", response_model=UserOut)
def accept_invite(payload: InviteAccept, db: Session = Depends(get_db)):
    invite = db.query(InviteToken).filter(
        InviteToken.token == payload.token,
        InviteToken.used == False
    ).first()
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    if datetime.now(timezone.utc) > invite.expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Invite token has expired")
    user = User(
        email=invite.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
        role=invite.role,
    )
    db.add(user)
    invite.used = True
    db.commit()
    db.refresh(user)
    return user

@router.get("/invites")
def list_invites(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    invites = db.query(InviteToken).filter(InviteToken.used == False).all()
    return [{"email": i.email, "role": i.role, "token": i.token,
             "expires_at": i.expires_at, "created_at": i.created_at} for i in invites]
