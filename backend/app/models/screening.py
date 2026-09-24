from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Screening(Base):
    __tablename__ = "screenings"

    id                      = Column(Integer, primary_key=True, index=True)
    patient_id              = Column(Integer, ForeignKey("patients.id"), nullable=False)
    dr_grade                = Column(Integer, nullable=False)
    dr_confidence           = Column(Float, nullable=True)
    dme_present             = Column(Boolean, default=False)
    dme_confidence          = Column(Float, nullable=True)
    quality_score           = Column(Integer, nullable=True)
    fundus_image_url        = Column(String, nullable=True)
    heatmap_url             = Column(String, nullable=True)
    vessel_map_url          = Column(String, nullable=True)
    risk_stratification     = Column(String, nullable=True)
    referral_recommended    = Column(Boolean, default=False)
    reviewed                = Column(Boolean, default=False)
    recommendation_text     = Column(Text, nullable=True)
    recommendation_language = Column(String, default="english")
    microaneurysm_count     = Column(Integer, default=0, nullable=True)
    microaneurysm_url       = Column(String, nullable=True)
    exudate_area_percent    = Column(Float, default=0.0, nullable=True)
    exudate_url             = Column(String, nullable=True)
    hemorrhage_count        = Column(Integer, default=0, nullable=True)
    hemorrhage_url          = Column(String, nullable=True)
    optic_disc_center       = Column(JSON, nullable=True)
    optic_disc_url          = Column(String, nullable=True)
    email_status            = Column(String, nullable=True)  # "sent" | "failed" | "skipped"
    email_sent_at           = Column(DateTime(timezone=True), nullable=True)
    created_at              = Column(DateTime(timezone=True), server_default=func.now())
