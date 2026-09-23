import numpy as np
import uuid
from pathlib import Path
from PIL import Image
from skimage.filters import frangi, gaussian
from skimage.morphology import remove_small_objects
from skimage.measure import label

VESSEL_DIR = Path("static/screenings/vessels")
VESSEL_DIR.mkdir(parents=True, exist_ok=True)


def extract_vessels(image_path: str) -> dict:
    """
    Frangi multiscale vessel enhancement filter.
    Detects retinal blood vessels — clinically relevant for:
    - Vessel tortuosity (indicates severe DR)
    - Neovascularization (indicates Proliferative DR Grade 4)
    - Vessel caliber changes (indicates hypertensive retinopathy)
    """
    pil_img = Image.open(image_path).convert("RGB")
    img = np.array(pil_img, dtype=np.float32) / 255.0

    # Use green channel — highest vessel/background contrast in fundus images
    green = img[:, :, 1]

    # Mild gaussian smoothing before Frangi
    green_smooth = gaussian(green, sigma=1.0)

    # Frangi filter — detects tubular structures at multiple scales
    vessel_map = frangi(
        green_smooth,
        sigmas=range(1, 5),
        alpha=0.5,
        beta=0.5,
        black_ridges=False
    )

    # Normalize to 0-1
    if vessel_map.max() > 0:
        vessel_map = vessel_map / vessel_map.max()

    # Binary vessel mask — threshold
    binary_mask = vessel_map > 0.1

    # Remove small noise objects
    labeled = label(binary_mask)
    binary_mask = remove_small_objects(labeled > 0, min_size=50)

    # Create colored vessel overlay (green vessels on black background)
    overlay = np.zeros((*green.shape, 3), dtype=np.uint8)
    overlay[binary_mask, 1] = 200  # green channel for vessels

    # Blend with original image
    original_uint8 = (img * 255).astype(np.uint8)
    blended = original_uint8.copy()
    blended[binary_mask] = (
        0.4 * original_uint8[binary_mask] +
        0.6 * overlay[binary_mask]
    ).astype(np.uint8)

    # Save vessel map
    timestamp = uuid.uuid4().hex
    vessel_filename = f"{timestamp}_vessels.jpg"
    vessel_path = str(VESSEL_DIR / vessel_filename)
    Image.fromarray(blended).save(vessel_path, quality=95)

    # Save binary mask as separate image
    mask_filename = f"{timestamp}_vessel_mask.jpg"
    mask_path = str(VESSEL_DIR / mask_filename)
    mask_img = (binary_mask * 255).astype(np.uint8)
    Image.fromarray(mask_img).save(mask_path, quality=95)

    # Calculate vessel density
    vessel_density = float(np.sum(binary_mask) / binary_mask.size * 100)

    return {
        "vessel_map_url": f"/static/screenings/vessels/{vessel_filename}",
        "vessel_mask_url": f"/static/screenings/vessels/{mask_filename}",
        "vessel_density": round(vessel_density, 2),
        "vessel_map": binary_mask  # numpy array for use by other services
    }