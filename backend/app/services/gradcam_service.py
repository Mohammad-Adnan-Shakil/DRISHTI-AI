import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from pathlib import Path
import uuid
import timm

GRADCAM_DIR = Path("static/screenings/gradcam")
GRADCAM_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = Path("models/efficientnet_b4_dr.pth")

# Global model cache — load once, reuse
_model = None
_hooks = {}

def _get_model():
    global _model
    if _model is not None:
        return _model

    model = timm.create_model('efficientnet_b4', pretrained=False, num_classes=5)
    state = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)

    # Handle different checkpoint formats
    if isinstance(state, dict) and 'model_state_dict' in state:
        state = state['model_state_dict']
    elif isinstance(state, dict) and 'state_dict' in state:
        state = state['state_dict']

    try:
        model.load_state_dict(state, strict=True)
    except RuntimeError:
        model.load_state_dict(state, strict=False)

    model.eval()
    _model = model
    return model


def generate_gradcam(image_path: str, target_grade: int = None) -> dict:
    """
    True Grad-CAM using PyTorch backprop through EfficientNet-B4.
    Highlights regions that drove the DR grade prediction.
    """
    model = _get_model()

    # Preprocess image
    pil_img = Image.open(image_path).convert("RGB").resize((380, 380))
    img_array = np.array(pil_img, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_norm = (img_array - mean) / std
    img_tensor = torch.FloatTensor(img_norm).permute(2, 0, 1).unsqueeze(0)

    # Hook storage
    gradients = []
    activations = []

    def forward_hook(module, input, output):
        activations.append(output.detach())

    def backward_hook(module, grad_input, grad_output):
        gradients.append(grad_output[0].detach())

    # Register hooks on last conv block
    target_layer = model.blocks[-1]
    fwd_handle = target_layer.register_forward_hook(forward_hook)
    bwd_handle = target_layer.register_full_backward_hook(backward_hook)

    # Forward pass
    img_tensor.requires_grad = True
    output = model(img_tensor)
    pred_class = output.argmax(dim=1).item()
    target = target_grade if target_grade is not None else pred_class
    score = output[0, target]

    # Backward pass
    model.zero_grad()
    score.backward()

    # Remove hooks
    fwd_handle.remove()
    bwd_handle.remove()

    # Generate Grad-CAM heatmap
    grads = gradients[0].squeeze()      # [C, H, W]
    acts = activations[0].squeeze()     # [C, H, W]

    # Global average pool gradients
    weights = grads.mean(dim=(1, 2))    # [C]
    cam = (weights[:, None, None] * acts).sum(dim=0)  # [H, W]
    cam = torch.relu(cam)

    # Normalize
    cam = cam.numpy()
    if cam.max() > 0:
        cam = cam / cam.max()

    # Resize to original image size
    cam_pil = Image.fromarray((cam * 255).astype(np.uint8)).resize(
        (pil_img.width, pil_img.height), Image.BILINEAR
    )
    cam_np = np.array(cam_pil, dtype=np.float32) / 255.0

    # Apply colormap (jet-like: blue→green→red)
    heatmap = np.zeros((*cam_np.shape, 3), dtype=np.float32)
    heatmap[:, :, 0] = np.clip(1.5 - abs(cam_np * 4 - 3), 0, 1)  # R
    heatmap[:, :, 1] = np.clip(1.5 - abs(cam_np * 4 - 2), 0, 1)  # G
    heatmap[:, :, 2] = np.clip(1.5 - abs(cam_np * 4 - 1), 0, 1)  # B

    # Blend with original
    original = np.array(pil_img, dtype=np.float32) / 255.0
    blended = 0.5 * original + 0.5 * heatmap
    blended = np.clip(blended * 255, 0, 255).astype(np.uint8)

    # Save
    filename = f"{uuid.uuid4().hex}_gradcam_true.jpg"
    save_path = str(GRADCAM_DIR / filename)
    Image.fromarray(blended).save(save_path, quality=95)

    return {
        "heatmap_url": f"/static/screenings/gradcam/{filename}",
        "predicted_class": pred_class,
        "method": "grad-cam"
    }