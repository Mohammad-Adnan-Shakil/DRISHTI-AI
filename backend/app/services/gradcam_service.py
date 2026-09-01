import torch
import numpy as np
import cv2
from PIL import Image
from torchvision import transforms
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pathlib import Path
import uuid

from app.services.model_service import classifier

HEATMAP_DIR = Path("static/heatmaps")
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)

transform = transforms.Compose([
    transforms.Resize((380, 380)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

def generate_gradcam(image_path: str, target_grade: int = None) -> dict:
    # Load image
    pil_img = Image.open(image_path).convert("RGB")
    input_tensor = transform(pil_img).unsqueeze(0).to(classifier.device)

    # Get predicted grade if not specified
    if target_grade is None:
        with torch.no_grad():
            logits = classifier.model(input_tensor)
            target_grade = torch.argmax(logits, dim=1).item()

    # Target the last conv block in EfficientNet-B4
    # timm EfficientNet-B4 last conv layer
    target_layers = [classifier.model.conv_head]

    # Run Grad-CAM
    targets = [ClassifierOutputTarget(target_grade)]
    with GradCAM(model=classifier.model, target_layers=target_layers) as cam:
        grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
        grayscale_cam = grayscale_cam[0]  # single image

    # Prepare RGB image for overlay (normalized to [0,1])
    rgb_img = np.array(pil_img.resize((380, 380)), dtype=np.float32) / 255.0

    # Generate heatmap overlay
    cam_image = show_cam_on_image(rgb_img, grayscale_cam, use_rgb=True)

    # Save heatmap
    heatmap_filename = f"gradcam_{uuid.uuid4().hex}.jpg"
    heatmap_path = str(HEATMAP_DIR / heatmap_filename)
    cv2.imwrite(heatmap_path, cv2.cvtColor(cam_image, cv2.COLOR_RGB2BGR))

    return {
        "heatmap_path": heatmap_path,
        "heatmap_url": f"/static/heatmaps/{heatmap_filename}",
        "target_grade": target_grade,
        "cam_intensity": float(np.mean(grayscale_cam))
    }