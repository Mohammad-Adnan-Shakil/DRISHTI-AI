import numpy as np
import uuid
from pathlib import Path
from PIL import Image, ImageFilter

TEMP_DIR = Path("static/temp")
TEMP_DIR.mkdir(parents=True, exist_ok=True)


def normalize_illumination(img: np.ndarray) -> np.ndarray:
    """Correct uneven illumination using background estimation."""
    r, g, b = img[:,:,0], img[:,:,1], img[:,:,2]
    # Estimate background using large gaussian blur (low frequency = illumination)
    from PIL import ImageFilter
    g_pil = Image.fromarray(g)
    background = np.array(g_pil.filter(ImageFilter.GaussianBlur(radius=50)), dtype=np.float32)
    mean_bg = np.mean(background)
    # Normalize each channel by the background estimate
    result = np.zeros_like(img, dtype=np.float32)
    for i, ch in enumerate([r, g, b]):
        bg = np.array(Image.fromarray(ch).filter(ImageFilter.GaussianBlur(radius=50)), dtype=np.float32)
        normalized = ch.astype(np.float32) * (mean_bg / np.maximum(bg, 1))
        result[:,:,i] = np.clip(normalized, 0, 255)
    return result.astype(np.uint8)


def denoise(img: np.ndarray) -> np.ndarray:
    """Gaussian denoising to remove sensor noise from low-cost cameras."""
    pil = Image.fromarray(img)
    denoised = pil.filter(ImageFilter.GaussianBlur(radius=0.8))
    return np.array(denoised, dtype=np.uint8)


def apply_clahe(img: np.ndarray) -> np.ndarray:
    """CLAHE in LAB colorspace — Python reimplementation of MATLAB's adapthisteq algorithm."""
    r, g, b = img[:,:,0], img[:,:,1], img[:,:,2]
    l = (0.299 * r + 0.587 * g + 0.114 * b).astype(np.uint8)
    tile_h = max(1, l.shape[0] // 8)
    tile_w = max(1, l.shape[1] // 8)
    l_clahe = l.copy().astype(np.float32)
    for i in range(8):
        for j in range(8):
            y0, y1 = i*tile_h, (i+1)*tile_h
            x0, x1 = j*tile_w, (j+1)*tile_w
            tile = l[y0:y1, x0:x1]
            if tile.size == 0:
                continue
            hist, _ = np.histogram(tile.flatten(), 256, [0, 256])
            cdf = hist.cumsum()
            cdf_min = cdf[cdf > 0].min()
            pixels = tile.size
            denom = pixels - cdf_min
            if denom == 0:
                continue
            tile_eq = np.round((cdf[tile] - cdf_min) / denom * 255)
            l_clahe[y0:y1, x0:x1] = np.clip(tile_eq, 0, 255)
    l_clahe = l_clahe.astype(np.uint8)
    scale = np.where(l > 0, l_clahe.astype(np.float32) / np.maximum(l.astype(np.float32), 1), 1.0)
    r_out = np.clip(r * scale, 0, 255).astype(np.uint8)
    g_out = np.clip(g * scale, 0, 255).astype(np.uint8)
    b_out = np.clip(b * scale, 0, 255).astype(np.uint8)
    return np.stack([r_out, g_out, b_out], axis=2)


def run_quality_check(image_path: str) -> dict:
    pil_img = Image.open(image_path).convert("RGB")
    img = np.array(pil_img, dtype=np.float32)

    gray = np.dot(img, [0.299, 0.587, 0.114])

    brightness = float(np.mean(gray))
    contrast   = float(np.std(gray))
    gray_pil   = Image.fromarray(gray.astype(np.uint8))
    sharp_img  = np.array(gray_pil.filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    sharpness  = float(np.var(sharp_img))

    brightness_score = 33 if 30 <= brightness <= 220 else 0
    contrast_score   = 33 if contrast >= 25 else 0
    sharpness_score  = 34 if sharpness >= 20 else 0
    quality_score    = brightness_score + contrast_score + sharpness_score

    # --- Localized glare / occlusion check (8x8 tile grid) ---
    # A global average can hide a small overexposed or blacked-out patch
    # covering part of the retina — this catches it independently of the
    # whole-image brightness/contrast/sharpness scores above.
    GLARE_THRESHOLD = 200
    DARK_THRESHOLD  = 15
    tile_rows, tile_cols = 8, 8
    h, w = gray.shape
    row_step = max(1, h // tile_rows)
    col_step = max(1, w // tile_cols)

    glare_tiles = 0
    dark_tiles  = 0
    total_tiles = 0

    for i in range(tile_rows):
        for j in range(tile_cols):
            y0, y1 = i * row_step, min((i + 1) * row_step, h)
            x0, x1 = j * col_step, min((j + 1) * col_step, w)
            tile = gray[y0:y1, x0:x1]
            if tile.size == 0:
                continue
            tile_mean = float(np.mean(tile))
            total_tiles += 1
            if tile_mean > GLARE_THRESHOLD:
                glare_tiles += 1
            if tile_mean < DARK_THRESHOLD:
                dark_tiles += 1

    glare_fraction = glare_tiles / total_tiles if total_tiles else 0
    dark_fraction  = dark_tiles / total_tiles if total_tiles else 0
    localized_defect = (glare_fraction > 0.03) or (dark_fraction > 0.10)

    passed = (quality_score >= 60) and not localized_defect

    img_uint8 = np.array(pil_img, dtype=np.uint8)

    # Step 1: Illumination normalization
    normalized = normalize_illumination(img_uint8)

    # Step 2: Gaussian denoising
    denoised = denoise(normalized)

    # Step 3: CLAHE enhancement
    enhanced = apply_clahe(denoised)

    output_path = str(TEMP_DIR / f"clahe_{uuid.uuid4().hex}.jpg")
    Image.fromarray(enhanced).save(output_path, quality=95)
    output_filename = Path(output_path).name

    return {
        "quality_score": quality_score,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "glare_fraction": round(glare_fraction, 3),
        "dark_fraction": round(dark_fraction, 3),
        "localized_defect": localized_defect,
        "passed": passed,
        "enhanced_image_path": f"/static/temp/{output_filename}"
    }