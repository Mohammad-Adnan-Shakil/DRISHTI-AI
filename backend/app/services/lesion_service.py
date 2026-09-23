import numpy as np
import uuid
from pathlib import Path
from PIL import Image
from skimage.filters import gaussian, threshold_otsu
from skimage.morphology import remove_small_objects, remove_small_holes, disk, opening, closing
from skimage.measure import label, regionprops
from skimage.feature import blob_dog

LESION_DIR = Path("static/screenings/lesions")
LESION_DIR.mkdir(parents=True, exist_ok=True)


def detect_microaneurysms(image_path: str) -> dict:
    """
    Microaneurysm detection using top-hat transform + blob detection.
    Microaneurysms are the earliest clinical sign of DR (Grade 1 indicator).
    Appear as small dark red dots on the fundus.
    """
    pil_img = Image.open(image_path).convert("RGB")
    img = np.array(pil_img, dtype=np.float32) / 255.0

    # Green channel has best MA contrast
    green = img[:, :, 1]

    # Invert — MAs are dark on bright background
    green_inv = 1.0 - green

    # Gaussian smoothing
    smoothed = gaussian(green_inv, sigma=1.5)

    # Blob detection (Difference of Gaussians) — finds circular dark spots
    blobs = blob_dog(
        smoothed,
        min_sigma=1,
        max_sigma=4,
        threshold=0.04
    )

    # Filter by size — MAs are 20-200 microns (~2-8 pixels at standard resolution)
    ma_blobs = [b for b in blobs if 1.5 <= b[2] <= 5.0]

    # Create overlay
    overlay = np.array(pil_img, dtype=np.uint8).copy()
    for blob in ma_blobs:
        y, x, r = int(blob[0]), int(blob[1]), max(2, int(blob[2]))
        # Draw red circle marker
        for dy in range(-r, r+1):
            for dx in range(-r, r+1):
                if abs(dy**2 + dx**2 - r**2) < r:
                    ny, nx = y+dy, x+dx
                    if 0 <= ny < overlay.shape[0] and 0 <= nx < overlay.shape[1]:
                        overlay[ny, nx] = [255, 50, 50]

    filename = f"{uuid.uuid4().hex}_microaneurysms.jpg"
    save_path = str(LESION_DIR / filename)
    Image.fromarray(overlay).save(save_path, quality=95)

    return {
        "microaneurysm_url": f"/static/screenings/lesions/{filename}",
        "microaneurysm_count": len(ma_blobs),
        "microaneurysm_locations": [[int(b[0]), int(b[1])] for b in ma_blobs]
    }


def detect_exudates(image_path: str) -> dict:
    """
    Exudate detection using bright region segmentation.
    Hard exudates are lipid deposits — bright yellow/white patches.
    Key indicator for Grade 2+ DR and DME.
    """
    pil_img = Image.open(image_path).convert("RGB")
    img = np.array(pil_img, dtype=np.float32) / 255.0

    r, g, b = img[:,:,0], img[:,:,1], img[:,:,2]

    # Exudates are bright in all channels
    brightness = (r + g + b) / 3.0

    # Smooth
    smoothed = gaussian(brightness, sigma=2.0)

    # Threshold bright regions
    thresh = threshold_otsu(smoothed)
    bright_mask = smoothed > (thresh * 1.2)

    # Remove small noise
    bright_mask = remove_small_objects(bright_mask, min_size=30)
    bright_mask = remove_small_holes(bright_mask, area_threshold=20)

    # Approximate optic disc removal (brightest large region)
    labeled = label(bright_mask)
    props = regionprops(labeled)
    if props:
        largest = max(props, key=lambda p: p.area)
        if largest.area > 500:
            bright_mask[labeled == largest.label] = False

    # Create yellow overlay
    overlay = np.array(pil_img, dtype=np.uint8).copy()
    overlay[bright_mask] = (
        0.4 * overlay[bright_mask] + 0.6 * np.array([255, 255, 0])
    ).astype(np.uint8)

    filename = f"{uuid.uuid4().hex}_exudates.jpg"
    save_path = str(LESION_DIR / filename)
    Image.fromarray(overlay).save(save_path, quality=95)

    exudate_area = float(np.sum(bright_mask) / bright_mask.size * 100)

    return {
        "exudate_url": f"/static/screenings/lesions/{filename}",
        "exudate_area_percent": round(exudate_area, 3)
    }


def detect_hemorrhages(image_path: str) -> dict:
    """
    Hemorrhage detection using dark region segmentation on red channel.
    Dot and blot hemorrhages indicate progressive DR (Grade 2-3).
    """
    pil_img = Image.open(image_path).convert("RGB")
    img = np.array(pil_img, dtype=np.float32) / 255.0

    # Red channel — hemorrhages are dark red
    red = img[:, :, 0]
    green = img[:, :, 1]

    # Hemorrhages are darker than surroundings on red channel
    # but not as dark as vessels
    diff = red - green
    smoothed = gaussian(diff, sigma=2.0)

    # Dark regions on red channel
    dark_mask = smoothed > 0.05

    # Remove very small objects (noise) and very large objects (optic disc)
    dark_mask = remove_small_objects(dark_mask, min_size=20)

    labeled = label(dark_mask)
    props = regionprops(labeled)
    hemorrhage_mask = np.zeros_like(dark_mask)
    for prop in props:
        # Hemorrhages are medium-sized dark blobs
        if 20 < prop.area < 2000:
            hemorrhage_mask[labeled == prop.label] = True

    # Create dark red overlay
    overlay = np.array(pil_img, dtype=np.uint8).copy()
    overlay[hemorrhage_mask] = (
        0.4 * overlay[hemorrhage_mask] + 0.6 * np.array([180, 0, 0])
    ).astype(np.uint8)

    filename = f"{uuid.uuid4().hex}_hemorrhages.jpg"
    save_path = str(LESION_DIR / filename)
    Image.fromarray(overlay).save(save_path, quality=95)

    hemorrhage_count = len([p for p in regionprops(label(hemorrhage_mask))])

    return {
        "hemorrhage_url": f"/static/screenings/lesions/{filename}",
        "hemorrhage_count": hemorrhage_count
    }


def detect_optic_disc(image_path: str) -> dict:
    """
    Optic disc localization using brightest region detection.
    Provides anatomical reference for lesion localization.
    """
    pil_img = Image.open(image_path).convert("RGB")
    img = np.array(pil_img, dtype=np.float32) / 255.0

    green = img[:, :, 1]
    smoothed = gaussian(green, sigma=5.0)

    # Optic disc is the brightest large circular region
    thresh = threshold_otsu(smoothed)
    bright = smoothed > thresh

    labeled = label(bright)
    props = regionprops(labeled)

    if not props:
        return {"optic_disc_center": None, "optic_disc_url": None}

    # Largest bright region = optic disc
    largest = max(props, key=lambda p: p.area)
    cy, cx = int(largest.centroid[0]), int(largest.centroid[1])
    radius = int(np.sqrt(largest.area / np.pi))

    # Draw circle on overlay
    overlay = np.array(pil_img, dtype=np.uint8).copy()
    for angle in range(360):
        rad = np.radians(angle)
        y = int(cy + radius * np.sin(rad))
        x = int(cx + radius * np.cos(rad))
        if 0 <= y < overlay.shape[0] and 0 <= x < overlay.shape[1]:
            overlay[y, x] = [0, 255, 255]  # cyan circle

    filename = f"{uuid.uuid4().hex}_optic_disc.jpg"
    save_path = str(LESION_DIR / filename)
    Image.fromarray(overlay).save(save_path, quality=95)

    return {
        "optic_disc_url": f"/static/screenings/lesions/{filename}",
        "optic_disc_center": [cy, cx],
        "optic_disc_radius": radius
    }


def run_full_lesion_analysis(image_path: str) -> dict:
    """Run all lesion detectors and return combined results."""
    results = {}

    try:
        ma = detect_microaneurysms(image_path)
        results.update(ma)
    except Exception as e:
        results["microaneurysm_url"] = None
        results["microaneurysm_count"] = 0

    try:
        ex = detect_exudates(image_path)
        results.update(ex)
    except Exception as e:
        results["exudate_url"] = None
        results["exudate_area_percent"] = 0

    try:
        hm = detect_hemorrhages(image_path)
        results.update(hm)
    except Exception as e:
        results["hemorrhage_url"] = None
        results["hemorrhage_count"] = 0

    try:
        od = detect_optic_disc(image_path)
        results.update(od)
    except Exception as e:
        results["optic_disc_url"] = None
        results["optic_disc_center"] = None

    return results