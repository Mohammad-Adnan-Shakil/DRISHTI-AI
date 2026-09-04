from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

LANGUAGE_NAMES = {
    "english": "English",
    "kannada": "Kannada",
    "hindi": "Hindi",
    "tamil": "Tamil",
    "telugu": "Telugu",
    "marathi": "Marathi"
}

DR_GRADE_LABELS = {
    0: "No Diabetic Retinopathy",
    1: "Mild Diabetic Retinopathy",
    2: "Moderate Diabetic Retinopathy",
    3: "Severe Diabetic Retinopathy",
    4: "Proliferative Diabetic Retinopathy"
}

RISK_ACTIONS = {
    0: "annual screening",
    1: "follow-up in 6 months",
    2: "referral to ophthalmologist within 3 months",
    3: "urgent referral within 2 weeks",
    4: "emergency referral within 48 hours"
}

def generate_recommendation(dr_grade, dme_present, risk_stratification, language, patient_context):
    lang_name = LANGUAGE_NAMES.get(language, "English")
    grade_label = DR_GRADE_LABELS.get(dr_grade, "Unknown")
    action = RISK_ACTIONS.get(dr_grade, "follow-up")

    prompt = (
        "You are a medical AI assistant for rural health workers in India.\n"
        f"Write a short recommendation in {lang_name} only.\n"
        "Rules: only the target language, under 80 words, simple words, no jargon.\n\n"
        f"DR Grade: {dr_grade} ({grade_label})\n"
        f"DME: {'Present - urgent attention needed' if dme_present else 'Absent'}\n"
        f"Risk: {risk_stratification}\n"
        f"Action: {action}\n"
        f"Patient: age {patient_context.get('age')}, "
        f"diabetes {patient_context.get('diabetes_duration_years')} years, "
        f"HbA1c {patient_context.get('hba1c_level')}, "
        f"hypertension {'yes' if patient_context.get('hypertension') else 'no'}\n\n"
        f"Write the recommendation in {lang_name} now:"
    )

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.3
    )

    return response.choices[0].message.content.strip()
