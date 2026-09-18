import numpy as np
import uuid
from pathlib import Path
from PIL import Image, ImageFilter

TEMP_DIR = Path("static/temp")
TEMP_DIR.mkdir(parents=True, exist_ok=True)

def run_quality_check(image_path: str) -> dict:
    pil_img = Image.open(image_path).convert("RGB")
    img = np.array(pil_img, dtype=np.float32)

    gray = np.dot(img, [0.299, 0.587, 0.114])

    brightness = float(np.mean(gray))
    contrast   = float(np.std(gray))
    laplacian  = np.array([[0,1,0],[1,-4,1],[0,1,0]], dtype=np.float32)
    from PIL import ImageFilter
    gray_pil   = Image.fromarray(gray.astype(np.uint8))
    sharp_img  = np.array(gray_pil.filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    sharpness  = float(np.var(sharp_img))

    brightness_score = 33 if 30 <= brightness <= 220 else 0
    contrast_score   = 33 if contrast >= 25 else 0
    sharpness_score  = 34 if sharpness >= 20 else 0
    quality_score    = brightness_score + contrast_score + sharpness_score
    passed           = quality_score >= 60

    # CLAHE in LAB colorspace using Pillow
    img_uint8 = np.array(pil_img, dtype=np.uint8)
    r, g, b = img_uint8[:,:,0], img_uint8[:,:,1], img_uint8[:,:,2]

    # Convert to LAB approximation — apply CLAHE on L channel via histogram equalization
    l = (0.299 * r + 0.587 * g + 0.114 * b).astype(np.uint8)
    l_pil = Image.fromarray(l)

    # Pillow CLAHE equivalent: local histogram equalization via tile processing
    tile_h, tile_w = l.shape[0] // 8, l.shape[1] // 8
    l_clahe = l.copy().astype(np.float32)
    for i in range(8):
        for j in range(8):
            y0, y1 = i*tile_h, (i+1)*tile_h
            x0, x1 = j*tile_w, (j+1)*tile_w
            tile = l[y0:y1, x0:x1]
            hist, bins = np.histogram(tile.flatten(), 256, [0,256])
            cdf = hist.cumsum()
            cdf_min = cdf[cdf > 0].min()
            pixels = tile.size
            tile_eq = np.round((cdf[tile] - cdf_min) / (pixels - cdf_min) * 255)
            l_clahe[y0:y1, x0:x1] = np.clip(tile_eq, 0, 255)

    l_clahe = l_clahe.astype(np.uint8)
    scale = np.where(l > 0, l_clahe.astype(np.float32) / np.maximum(l.astype(np.float32), 1), 1.0)
    r_out = np.clip(r * scale, 0, 255).astype(np.uint8)
    g_out = np.clip(g * scale, 0, 255).astype(np.uint8)
    b_out = np.clip(b * scale, 0, 255).astype(np.uint8)
    enhanced = np.stack([r_out, g_out, b_out], axis=2)

    output_path = str(TEMP_DIR / f"clahe_{uuid.uuid4().hex}.jpg")
    Image.fromarray(enhanced).save(output_path, quality=95)
    output_filename = Path(output_path).name

    return {
        "quality_score": quality_score,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "passed": passed,
        "enhanced_image_path": f"/static/temp/{output_filename}"
    }