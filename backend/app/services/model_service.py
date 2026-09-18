import numpy as np
import onnxruntime as ort
from PIL import Image
from pathlib import Path

from app.core.config import settings

GRADE_LABELS = {
    0: "No DR", 1: "Mild DR", 2: "Moderate DR",
    3: "Severe DR", 4: "Proliferative DR"
}

RISK_MAP = {
    0: {"risk": "No Risk", "action": "Monitor annually"},
    1: {"risk": "Low Risk", "action": "Monitor every 6 months"},
    2: {"risk": "Moderate Risk", "action": "Refer within 2-4 weeks"},
    3: {"risk": "High Risk", "action": "Refer within 2 weeks"},
    4: {"risk": "Critical", "action": "Urgent referral within 48 hours"}
}

ONNX_PATH = settings.model_path
ONNX_DATA_PATH = ONNX_PATH.with_suffix(f"{ONNX_PATH.suffix}.data")

class DRClassifier:
    def __init__(self):
        self._session = None
        self._load_error = None
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)

    def preprocess(self, image: Image.Image) -> np.ndarray:
        """Match the former Resize → ToTensor → Normalize preprocessing."""
        resized = image.resize((380, 380), Image.BILINEAR)
        tensor = np.asarray(resized, dtype=np.float32).transpose(2, 0, 1) / 255.0
        return ((tensor - self.mean) / self.std)[None, ...]

    def _get_session(self):
        if self._session is not None:
            return self._session

        if not ONNX_PATH.is_file() or not ONNX_DATA_PATH.is_file():
            self._load_error = "ONNX model or its external data file is missing"
            raise RuntimeError(self._load_error)

        print("[MODEL] Loading ONNX model from local files...")
        try:
            self._session = ort.InferenceSession(
                str(ONNX_PATH),
                providers=["CPUExecutionProvider"]
            )
        except Exception as exc:
            self._load_error = f"ONNX model could not be loaded: {exc}"
            raise RuntimeError(self._load_error) from exc
        print("[MODEL] ONNX session loaded — 92.8% sensitivity")
        return self._session

    def warmup(self) -> None:
        self._get_session()

    def status(self) -> dict:
        return {
            "available": ONNX_PATH.is_file() and ONNX_DATA_PATH.is_file(),
            "loaded": self._session is not None,
            "error": self._load_error,
        }

    @property
    def session(self):
        """Public accessor for callers (e.g. gradcam_service) that need to
        run the ONNX session directly instead of through predict()."""
        return self._get_session()

    def predict(self, image: Image.Image):
        session = self._get_session()
        tensor = self.preprocess(image)
        logits = session.run(None, {"input": tensor})[0][0]
        probs = np.exp(logits) / np.sum(np.exp(logits))
        grade = int(np.argmax(probs))
        confidence = round(float(probs[grade]) * 100, 2)
        return {
            "grade":      grade,
            "label":      GRADE_LABELS[grade],
            "confidence": confidence,
            "risk":       RISK_MAP[grade]["risk"],
            "action":     RISK_MAP[grade]["action"],
            "all_probs":  probs.tolist()
        }

classifier = DRClassifier()
