import cv2
import numpy as np
import uuid
from pathlib import Path

TEMP_DIR = Path("static/temp")
TEMP_DIR.mkdir(parents=True, exist_ok=True)

def run_quality_check(image_path: str) -> dict:
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --- Quality Metrics (same logic as MATLAB script) ---
    brightness = float(np.mean(gray))
    contrast   = float(np.std(gray))
    sharpness  = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    # --- Scoring (fundus-tuned thresholds) ---
    brightness_score = 33 if 30 <= brightness <= 220 else 0
    contrast_score   = 33 if contrast >= 25 else 0
    sharpness_score  = 34 if sharpness >= 20 else 0
    quality_score    = brightness_score + contrast_score + sharpness_score
    passed           = quality_score >= 60

    # --- CLAHE Enhancement (LAB colorspace, same as MATLAB) ---
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_clahe = clahe.apply(l)
    enhanced = cv2.merge([l_clahe, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    output_path = str(TEMP_DIR / f"clahe_{uuid.uuid4().hex}.jpg")
    cv2.imwrite(output_path, enhanced)

    return {
        "quality_score": quality_score,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "passed": passed,
        "enhanced_image_path": output_path
    }