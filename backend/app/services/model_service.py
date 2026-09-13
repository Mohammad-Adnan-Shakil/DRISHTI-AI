import numpy as np
import onnxruntime as ort
from torchvision import transforms
from PIL import Image
from pathlib import Path
import urllib.request
from app.core.config import settings

GRADE_LABELS = {
    0: "No DR", 1: "Mild DR", 2: "Moderate DR",
    3: "Severe DR", 4: "Proliferative DR"
}

RISK_MAP = {
    0: {"risk": "No Risk", "action": "Monitor annually"},
    1: {"risk": "Low Risk", "action": "Monitor every 6 months"},
    2: {"risk": "Moderate Risk", "action": "Refer within 3 months"},
    3: {"risk": "High Risk", "action": "Refer within 2 weeks"},
    4: {"risk": "Critical", "action": "Urgent referral within 48 hours"}
}

HF_ONNX_URL = "https://huggingface.co/adnshkl/drishti-efficientnet-b4-dr/resolve/main/efficientnet_b4_dr.onnx"
ONNX_PATH   = Path("models/efficientnet_b4_dr.onnx")

class DRClassifier:
    def __init__(self):
        self._session = None
        self.transform = transforms.Compose([
            transforms.Resize((380, 380)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])

    def _get_session(self):
        if self._session is not None:
            return self._session

        if not ONNX_PATH.exists():
            print("[MODEL] Downloading ONNX model from HuggingFace...")
            ONNX_PATH.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(HF_ONNX_URL, ONNX_PATH)
            print("[MODEL] Download complete.")

        self._session = ort.InferenceSession(
            str(ONNX_PATH),
            providers=["CPUExecutionProvider"]
        )
        print("[MODEL] ONNX session loaded — 92.8% sensitivity")
        return self._session

    def predict(self, image: Image.Image):
        session = self._get_session()
        tensor  = self.transform(image).unsqueeze(0).numpy()
        logits  = session.run(None, {"input": tensor})[0][0]
        probs   = np.exp(logits) / np.sum(np.exp(logits))
        grade   = int(np.argmax(probs))
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
