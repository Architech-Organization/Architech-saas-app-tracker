from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import Software, RenewalHistory, User, CategoryEnum
from app.schemas.schemas import (
    SoftwareCreate, SoftwareUpdate, SoftwareOut,
    RenewalActionCreate, RenewalHistoryOut, DashboardStats,
)

router = APIRouter(prefix="/software", tags=["software"])

# ── Dashboard stats ────────────────────────────────────────────────────────────
@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    today = date.today()
    all_sw = db.query(Software).all()
    total_spend = sum(s.annual_cost for s in all_sw) or Decimal(0)
    expiring_90 = sum(1 for s in all_sw if today <= s.renewal_date <= today + timedelta(days=90))
    expiring_30 = sum(1 for s in all_sw if today <= s.renewal_date <= today + timedelta(days=30))
    expired = sum(1 for s in all_sw if s.renewal_date < today)
    spend_by_cat = {}
    for cat in CategoryEnum:
        cat_spend = sum(s.annual_cost for s in all_sw if s.category == cat) or Decimal(0)
        spend_by_cat[cat.value] = float(cat_spend)
    return DashboardStats(
        total_software=len(all_sw),
        total_annual_spend=total_spend,
        expiring_90=expiring_90,
        expiring_30=expiring_30,
        expired=expired,
        spend_by_category=spend_by_cat,
    )

# ── CRUD ───────────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[SoftwareOut])
def list_software(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Software)
    if category:
        q = q.filter(Software.category == category)
    if status:
        q = q.filter(Software.status == status)
    if search:
        q = q.filter(Software.name.ilike(f"%{search}%") | Software.vendor.ilike(f"%{search}%"))
    return q.order_by(Software.renewal_date).all()

@router.post("/", response_model=SoftwareOut, status_code=201)
def create_software(payload: SoftwareCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sw = Software(**payload.model_dump(), owner_id=user.id)
    db.add(sw)
    db.commit()
    db.refresh(sw)
    return sw

@router.get("/{sw_id}", response_model=SoftwareOut)
def get_software(sw_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sw = db.query(Software).filter(Software.id == sw_id).first()
    if not sw:
        raise HTTPException(status_code=404, detail="Software not found")
    return sw

@router.patch("/{sw_id}", response_model=SoftwareOut)
def update_software(sw_id: int, payload: SoftwareUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sw = db.query(Software).filter(Software.id == sw_id).first()
    if not sw:
        raise HTTPException(status_code=404, detail="Software not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(sw, k, v)
    db.commit()
    db.refresh(sw)
    return sw

@router.delete("/{sw_id}", status_code=204)
def delete_software(sw_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sw = db.query(Software).filter(Software.id == sw_id).first()
    if not sw:
        raise HTTPException(status_code=404, detail="Software not found")
    db.delete(sw)
    db.commit()

# ── Renewal actions ────────────────────────────────────────────────────────────
@router.post("/{sw_id}/renew", response_model=SoftwareOut)
def log_renewal(sw_id: int, payload: RenewalActionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sw = db.query(Software).filter(Software.id == sw_id).first()
    if not sw:
        raise HTTPException(status_code=404, detail="Software not found")
    history = RenewalHistory(
        software_id=sw.id,
        action=payload.action,
        previous_cost=sw.annual_cost,
        new_cost=payload.new_cost,
        previous_renewal_date=sw.renewal_date,
        new_renewal_date=payload.new_renewal_date,
        note=payload.note,
        performed_by=user.id,
    )
    if payload.new_cost is not None:
        sw.annual_cost = payload.new_cost
    if payload.new_renewal_date is not None:
        sw.renewal_date = payload.new_renewal_date
    db.add(history)
    db.commit()
    db.refresh(sw)
    return sw

# ── Renewals timeline ──────────────────────────────────────────────────────────
@router.get("/renewals/upcoming", response_model=List[SoftwareOut])
def upcoming_renewals(days: int = 90, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    today = date.today()
    return db.query(Software).filter(
        Software.renewal_date >= today,
        Software.renewal_date <= today + timedelta(days=days),
    ).order_by(Software.renewal_date).all()
