from datetime import date, datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, DateTime,
    ForeignKey, Text, Enum as SAEnum, Boolean
)
from sqlalchemy.orm import relationship
import enum
from app.db.session import Base

class CategoryEnum(str, enum.Enum):
    development = "Development"
    operations = "Operations"
    sales = "Sales"
    hr = "HR"
    security = "Security"
    collaboration = "Collaboration"
    other = "Other"

class BillingEnum(str, enum.Enum):
    annual = "Annual"
    monthly = "Monthly"
    one_time = "One-time"

class StatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"

class CurrencyEnum(str, enum.Enum):
    cad = "CAD"
    usd = "USD"

class RoleEnum(str, enum.Enum):
    admin = "admin"
    editor = "editor"
    viewer = "viewer"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    software = relationship("Software", back_populates="owner_user")

class InviteToken(Base):
    __tablename__ = "invite_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False)
    role = Column(String(50), default="viewer")
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)

class Software(Base):
    __tablename__ = "software"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    vendor = Column(String(255), nullable=False)
    category = Column(SAEnum(CategoryEnum), nullable=False)
    billing_cycle = Column(SAEnum(BillingEnum), default=BillingEnum.annual)
    status = Column(SAEnum(StatusEnum), default=StatusEnum.active)
    annual_cost = Column(Numeric(12, 2), nullable=False, default=0)
    currency = Column(String(10), default="CAD")
    seats = Column(Integer, default=0)
    utilisation = Column(Integer, default=0)
    renewal_date = Column(Date, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner_label = Column(String(255))
    notes = Column(Text)
    contract_url = Column(String(1024))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    owner_user = relationship("User", back_populates="software")
    renewal_history = relationship("RenewalHistory", back_populates="software",
                                   cascade="all, delete-orphan")

class RenewalHistory(Base):
    __tablename__ = "renewal_history"
    id = Column(Integer, primary_key=True, index=True)
    software_id = Column(Integer, ForeignKey("software.id"), nullable=False)
    action = Column(String(100), nullable=False)
    previous_cost = Column(Numeric(12, 2))
    new_cost = Column(Numeric(12, 2))
    previous_renewal_date = Column(Date)
    new_renewal_date = Column(Date)
    note = Column(Text)
    performed_by = Column(Integer, ForeignKey("users.id"))
    performed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    software = relationship("Software", back_populates="renewal_history")
