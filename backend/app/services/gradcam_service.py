from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from pytorch_grad_cam.utils.image import show_cam_on_image

from app.services.model_service import classifier

HEATMAP_DIR = Path("static/screenings/gradcam")
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)

INPUT_SIZE = 380
PATCH_SIZE = 76  # 5x5 occlusion grid — each cell costs one ONNX forward pass


def _softmax(logits: np.ndarray) -> np.ndarray:
    exp = np.exp(logits - np.max(logits))
    return exp / exp.sum()


def _predict_probs(session, tensor: np.ndarray) -> np.ndarray:
    logits = session.run(None, {"input": tensor})[0][0]
    return _softmax(logits)


def generate_gradcam(image_path: str, target_grade: int = None) -> dict:
    """
    Occlusion-sensitivity explanation map for the ONNX DR classifier.

    True Grad-CAM needs gradients of the target class w.r.t. a conv layer's
    activations, which requires backprop through a live PyTorch module. The
    deployed classifier is an inference-only ONNX Runtime session (no
    autograd graph, no .model, no logits object to call .backward() on), so
    gradients aren't available. Occlusion sensitivity produces the same kind
    of signal — "which regions matter to the prediction" — using only
    forward passes: blank out each region of the image, re-run inference,
    and measure how much the target grade's confidence drops. A bigger drop
    means that region mattered more.
    """
    pil_img = Image.open(image_path).convert("RGB").resize((INPUT_SIZE, INPUT_SIZE))
    rgb_img = np.array(pil_img, dtype=np.float32) / 255.0

    session = classifier.session
    base_tensor = classifier.transform(pil_img).unsqueeze(0).numpy()

    baseline_probs = _predict_probs(session, base_tensor)
    if target_grade is None:
        target_grade = int(np.argmax(baseline_probs))
    baseline_score = baseline_probs[target_grade]

    # Mid-gray occlusion patch, expressed in the model's normalized input
    # space (same ImageNet mean/std used by classifier.transform).
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)
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

    grayscale_cam = cv2.resize(saliency, (INPUT_SIZE, INPUT_SIZE), interpolation=cv2.INTER_CUBIC)
    grayscale_cam = np.clip(grayscale_cam, 0, 1).astype(np.float32)

    # Generate heatmap overlay
    cam_image = show_cam_on_image(rgb_img, grayscale_cam, use_rgb=True)

    # Save heatmap
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    heatmap_filename = f"{timestamp}_gradcam.jpg"
    heatmap_path = str(HEATMAP_DIR / heatmap_filename)
    cv2.imwrite(heatmap_path, cv2.cvtColor(cam_image, cv2.COLOR_RGB2BGR))

    return {
        "heatmap_path": heatmap_path,
        "heatmap_url": f"/static/screenings/gradcam/{heatmap_filename}",
        "target_grade": target_grade,
        "cam_intensity": float(np.mean(grayscale_cam))
    }
