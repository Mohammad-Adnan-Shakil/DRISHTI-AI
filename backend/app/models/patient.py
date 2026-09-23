from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id                      = Column(Integer, primary_key=True, index=True)
    name                    = Column(String, nullable=False)
    age                     = Column(Integer, nullable=False)
    gender                  = Column(String, nullable=False)
    phone                   = Column(String, nullable=True)
    email                   = Column(String, nullable=True)
    phc_id                  = Column(String, nullable=True)
    diabetes_duration_years = Column(Float, nullable=True)
    hba1c_level             = Column(Float, nullable=True)
    hypertension            = Column(Boolean, default=False)
    family_history_dr       = Column(Boolean, default=False)
    preferred_language      = Column(String, default="english")

    diabetes_duration_score = Column(Integer, nullable=True)
    hba1c_score              = Column(Integer, nullable=True)
    bp_status_score          = Column(Integer, nullable=True)
    renal_marker_score       = Column(Integer, nullable=True)
    insulin_use_score        = Column(Integer, nullable=True)
    prior_dr_history_score   = Column(Integer, nullable=True)
    smoking_status_score     = Column(Integer, nullable=True)
    risk_score_total         = Column(Integer, nullable=True)
    risk_tier                = Column(String, nullable=True)

    created_at              = Column(DateTime(timezone=True), server_default=func.now())