from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image

from app.services.model_service import classifier

HEATMAP_DIR = Path("static/screenings/gradcam")
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)

INPUT_SIZE = 380
PATCH_SIZE = 76


def _softmax(logits: np.ndarray) -> np.ndarray:
    exp = np.exp(logits - np.max(logits))
    return exp / exp.sum()


def _predict_probs(session, tensor: np.ndarray) -> np.ndarray:
    logits = session.run(None, {"input": tensor})[0][0]
    return _softmax(logits)


def show_cam_on_image(image: np.ndarray, mask: np.ndarray) -> np.ndarray:
    # Jet colormap via numpy (replaces cv2.applyColorMap)
    mask_clipped = np.clip(mask, 0, 1)
    r = np.clip(1.5 - np.abs(4 * mask_clipped - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * mask_clipped - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * mask_clipped - 1), 0, 1)
    heatmap = np.stack([r, g, b], axis=2).astype(np.float32)
    overlay = heatmap + 0.5 * image
    overlay = overlay / np.max(overlay)
    return (overlay * 255).astype(np.uint8)


def generate_gradcam(image_path: str, target_grade: int = None) -> dict:
    pil_img = Image.open(image_path).convert("RGB").resize((INPUT_SIZE, INPUT_SIZE), Image.BILINEAR)
    rgb_img = np.array(pil_img, dtype=np.float32) / 255.0

    session = classifier.session
    base_tensor = classifier.preprocess(pil_img)

    baseline_probs = _predict_probs(session, base_tensor)
    if target_grade is None:
        target_grade = int(np.argmax(baseline_probs))
    baseline_score = baseline_probs[target_grade]

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
    std  = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)
    gray_value = ((0.5 - mean) / std).astype(np.float32)

    grid_size = INPUT_SIZE // PATCH_SIZE
    saliency = np.zeros((grid_size, grid_size), dtype=np.float32)

    for row in range(grid_size):
        y0, y1 = row * PATCH_SIZE, (row + 1) * PATCH_SIZE
        for col in range(grid_size):
            x0, x1 = col * PATCH_SIZE, (col + 1) * PATCH_SIZE
            occluded = base_tensor.copy()
            occluded[0, :, y0:y1, x0:x1] = gray_value
            probs = _predict_probs(session, occluded)
            saliency[row, col] = max(0.0, baseline_score - probs[target_grade])

    if saliency.max() > 0:
        saliency = saliency / saliency.max()

    # Resize saliency map with Pillow (replaces cv2.resize)
    saliency_pil = Image.fromarray((saliency * 255).astype(np.uint8)).resize(
        (INPUT_SIZE, INPUT_SIZE), Image.BICUBIC
    )
    grayscale_cam = np.array(saliency_pil, dtype=np.float32) / 255.0
    grayscale_cam = np.clip(grayscale_cam, 0, 1)

    cam_image = show_cam_on_image(rgb_img, grayscale_cam)

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    heatmap_filename = f"{timestamp}_gradcam.jpg"
    heatmap_path = str(HEATMAP_DIR / heatmap_filename)
    Image.fromarray(cam_image).save(heatmap_path, quality=95)

    return {
        "heatmap_path": heatmap_path,
        "heatmap_url": f"/static/screenings/gradcam/{heatmap_filename}",
        "target_grade": target_grade,
        "cam_intensity": float(np.mean(grayscale_cam))
    }