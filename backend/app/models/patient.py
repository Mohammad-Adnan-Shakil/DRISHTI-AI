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
    phc_id                  = Column(String, nullable=True)
    diabetes_duration_years = Column(Float, nullable=True)
    hba1c_level             = Column(Float, nullable=True)
    hypertension            = Column(Boolean, default=False)
    family_history_dr       = Column(Boolean, default=False)
    preferred_language      = Column(String, default="english")
    created_at              = Column(DateTime(timezone=True), server_default=func.now())
