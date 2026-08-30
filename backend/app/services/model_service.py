import torch
import torch.nn as nn
from torchvision import transforms
import timm
from PIL import Image
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

class DRClassifier:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        self.transform = transforms.Compose([
            transforms.Resize((380, 380)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])

    def _load_model(self):
        model = timm.create_model("efficientnet_b4", pretrained=True, num_classes=5)
        try:
            checkpoint = torch.load(settings.MODEL_PATH, map_location=self.device)
            model.load_state_dict(checkpoint)
            print(f"[MODEL] Loaded weights from {settings.MODEL_PATH}")
        except FileNotFoundError:
            print("[MODEL] No weights found — dev mode with ImageNet pretrained")
        model.to(self.device)
        model.eval()
        return model

    def predict(self, image: Image.Image):
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)
            confidence, grade = torch.max(probs, dim=1)
        grade = grade.item()
        confidence = round(confidence.item() * 100, 2)
        return {
            "grade": grade,
            "label": GRADE_LABELS[grade],
            "confidence": confidence,
            "risk": RISK_MAP[grade]["risk"],
            "action": RISK_MAP[grade]["action"],
            "all_probs": probs.squeeze().tolist()
        }

classifier = DRClassifier()