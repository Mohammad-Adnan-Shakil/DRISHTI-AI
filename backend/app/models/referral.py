from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Referral(Base):
    __tablename__ = "referrals"

    id                   = Column(Integer, primary_key=True, index=True)
    screening_id         = Column(Integer, ForeignKey("screenings.id"), nullable=False)
    patient_id           = Column(Integer, ForeignKey("patients.id"), nullable=False)
    status               = Column(String, default="pending")  # pending/sent/attended/no_show
    ophthalmologist_grade = Column(Integer, nullable=True)
    doctor_notes         = Column(Text, nullable=True)
    updated_at           = Column(DateTime(timezone=True), onupdate=func.now(),
                                  server_default=func.now())