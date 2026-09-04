from sqlalchemy import Column, Integer, Float, Boolean, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Screening(Base):
    __tablename__ = "screenings"

    id                      = Column(Integer, primary_key=True, index=True)
    patient_id              = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # DR classification
    dr_grade                = Column(Integer, nullable=False)        # 0-4
    dr_confidence           = Column(Float, nullable=True)
    
    # DME
    dme_present             = Column(Boolean, default=False)
    dme_confidence          = Column(Float, nullable=True)
    
    # Quality + explainability
    quality_score           = Column(Integer, nullable=True)
    heatmap_url             = Column(String, nullable=True)
    vessel_map_url          = Column(String, nullable=True)
    
    # Risk stratification
    risk_stratification     = Column(String, nullable=True)  # low/medium/high
    
    # Recommendation
    referral_recommended    = Column(Boolean, default=False)
    recommendation_text     = Column(Text, nullable=True)
    recommendation_language = Column(String, default="english")

    created_at = Column(DateTime(timezone=True), server_default=func.now())