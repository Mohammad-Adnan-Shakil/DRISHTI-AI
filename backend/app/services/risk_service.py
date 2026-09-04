def calculate_risk(dr_grade: int, patient: dict) -> dict:
    """
    Risk stratification based on DR grade + patient history.
    Returns risk_level, follow_up_months, risk_factors list.
    """
    risk_factors = []
    risk_score = 0

    # Base risk from DR grade
    grade_risk = {0: 0, 1: 20, 2: 50, 3: 80, 4: 100}
    risk_score += grade_risk.get(dr_grade, 0)

    # Diabetes duration
    duration = patient.get("diabetes_duration_years") or 0
    if duration >= 10:
        risk_score += 20
        risk_factors.append("Diabetes duration >= 10 years")
    elif duration >= 5:
        risk_score += 10
        risk_factors.append("Diabetes duration 5-10 years")

    # HbA1c
    hba1c = patient.get("hba1c_level") or 0
    if hba1c >= 9.0:
        risk_score += 20
        risk_factors.append("HbA1c >= 9.0 (poor control)")
    elif hba1c >= 7.5:
        risk_score += 10
        risk_factors.append("HbA1c 7.5-9.0 (suboptimal control)")

    # Hypertension
    if patient.get("hypertension"):
        risk_score += 15
        risk_factors.append("Hypertension present")

    # Family history
    if patient.get("family_history_dr"):
        risk_score += 10
        risk_factors.append("Family history of DR")

    # Cap at 100
    risk_score = min(risk_score, 100)

    # Determine risk level and follow-up
    if dr_grade >= 2:
        # Grade 2+ always referral regardless of other factors
        if dr_grade == 2:
            risk_level = "high"
            follow_up_months = 3
            action = "Refer to ophthalmologist within 3 months"
        elif dr_grade == 3:
            risk_level = "high"
            follow_up_months = 0.5  # 2 weeks
            action = "Urgent referral within 2 weeks"
        else:
            risk_level = "critical"
            follow_up_months = 0.1  # 48 hours
            action = "Emergency referral within 48 hours"
    elif dr_grade == 1:
        risk_level = "medium"
        follow_up_months = 6
        action = "Monitor every 6 months"
    else:
        # Grade 0 — risk stratify using patient history
        if risk_score >= 45:
            risk_level = "medium"
            follow_up_months = 6
            action = "High-risk profile — monitor every 6 months despite no DR"
        else:
            risk_level = "low"
            follow_up_months = 12
            action = "Annual screening recommended"

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "follow_up_months": follow_up_months,
        "action": action,
        "risk_factors": risk_factors
    }
