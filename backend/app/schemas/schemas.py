from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.models import CategoryEnum, BillingEnum, StatusEnum

# ── Auth ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "viewer"

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: datetime
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

# ── Software ───────────────────────────────────────────────────────────────────
class SoftwareCreate(BaseModel):
    name: str
    vendor: str
    category: CategoryEnum
    billing_cycle: BillingEnum = BillingEnum.annual
    status: StatusEnum = StatusEnum.active
    annual_cost: Decimal
    seats: int = 0
    utilisation: int = 0
    renewal_date: date
    owner_label: Optional[str] = None
    notes: Optional[str] = None
    contract_url: Optional[str] = None

class SoftwareUpdate(BaseModel):
    name: Optional[str] = None
    vendor: Optional[str] = None
    category: Optional[CategoryEnum] = None
    billing_cycle: Optional[BillingEnum] = None
    status: Optional[StatusEnum] = None
    annual_cost: Optional[Decimal] = None
    seats: Optional[int] = None
    utilisation: Optional[int] = None
    renewal_date: Optional[date] = None
    owner_label: Optional[str] = None
    notes: Optional[str] = None
    contract_url: Optional[str] = None

class RenewalHistoryOut(BaseModel):
    id: int
    action: str
    previous_cost: Optional[Decimal]
    new_cost: Optional[Decimal]
    previous_renewal_date: Optional[date]
    new_renewal_date: Optional[date]
    note: Optional[str]
    performed_at: datetime
    model_config = {"from_attributes": True}

class SoftwareOut(BaseModel):
    id: int
    name: str
    vendor: str
    category: CategoryEnum
    billing_cycle: BillingEnum
    status: StatusEnum
    annual_cost: Decimal
    seats: int
    utilisation: int
    renewal_date: date
    owner_label: Optional[str]
    notes: Optional[str]
    contract_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    renewal_history: List[RenewalHistoryOut] = []
    model_config = {"from_attributes": True}

# ── Renewal action ─────────────────────────────────────────────────────────────
class RenewalActionCreate(BaseModel):
    action: str  # renewed | cancelled | renegotiated | noted
    new_cost: Optional[Decimal] = None
    new_renewal_date: Optional[date] = None
    note: Optional[str] = None

# ── Dashboard ──────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_software: int
    total_annual_spend: Decimal
    expiring_90: int
    expiring_30: int
    expired: int
    spend_by_category: dict
