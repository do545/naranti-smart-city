"""
ORION · FICM 2026 — Extracción reproducible de recursos gráficos.

Genera los recursos de `src/assets/art`, `src/assets/photos` y `src/assets/brand`
a partir de la interfaz FICM aprobada (design/reference/ficm-interfaz-aprobada.webp).

NO se usa al compilar la aplicación. Sirve para regenerar los recursos o como
referencia de tamaños cuando se sustituyan por el arte oficial en alta resolución.

Requisitos (entorno aparte, no forma parte del proyecto web):
    python3 -m venv .venv && .venv/bin/pip install pillow numpy opencv-python-headless
    .venv/bin/python design/tools/extract_assets.py

Logotipo de Cinépolis (versión en negativo para el botón negro), a partir del
archivo oficial recibido (PNG/JPG/WebP, fondo blanco o transparente):
    .venv/bin/python design/tools/extract_assets.py --cinepolis ruta/al/logo-cinepolis.png
Guarda el original intacto como `src/assets/brand/cinepolis-logo-original.<ext>`
y crea `src/assets/brand/cinepolis-logo-white.webp` (misma forma y proporciones,
en blanco sobre transparente). Si Cinépolis entrega su versión negativa oficial
en SVG, basta con guardarla como `src/assets/brand/cinepolis-logo-white.svg`.

Coordenadas en píxeles de la referencia (956 × 1645).
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
REF = ROOT / "design" / "reference" / "ficm-interfaz-aprobada.webp"
ART = ROOT / "src" / "assets" / "art"
PHOTOS = ROOT / "src" / "assets" / "photos"
BRAND = ROOT / "src" / "assets" / "brand"

# Color del papel marfil medido en la referencia.
PAPER = np.array([242.0, 239.0, 231.0])
# Escala de la referencia (956 px de ancho) al lienzo del kiosco (1080 px).
K = 1080 / 956


# Pantone oficial del FICM: sustituye a TODO el rojo del arte y de las fotos
# (rosas, círculos del cartel, tira de película, "24°" del logotipo, cielo de Sedes).
ROSE_COLOR = (208, 130, 105)  # #D08269 · terracota / salmón cálido
# Contornos de las rosas: se conservan por si se quisiera recolorear solo las rosas
# (recolor_roses(rgb, only_roses=True)).

# Contorno de cada rosa, en px de cada recurso (encabezado 626×840 a escala 1.05 desde
# x 360; esquinas a escala K desde (0, 1366) y (600, 1290)). Se convierten a la referencia.
_ROSES_HEADER = [
    [(100, 25), (160, 10), (232, 22), (252, 60), (252, 120), (228, 160), (170, 172), (120, 158), (98, 112), (94, 60)],
    [(44, 80), (100, 60), (120, 100), (102, 146), (48, 152)],
    [(280, 560), (318, 498), (390, 466), (468, 454), (500, 478), (546, 500), (568, 560), (562, 624), (530, 690),
     (470, 722), (400, 732), (335, 726), (292, 700), (276, 640)],
    [(168, 742), (198, 700), (246, 684), (252, 706), (214, 738)],
    [(568, 515), (626, 505), (626, 566), (574, 562)],
]
_ROSES_CORNER_LEFT = [[(0, 148), (60, 138), (132, 148), (188, 190), (198, 250), (174, 300), (152, 315), (0, 315)],
                      [(200, 292), (305, 292), (305, 315), (200, 315)]]
_ROSES_CORNER_RIGHT = [[(252, 262), (300, 240), (360, 243), (402, 236), (402, 401), (222, 401), (220, 300), (232, 272)]]


def rose_polygons() -> list:
    k = 1080 / 956
    polys = [[(x / 1.05 + 360, y / 1.05) for x, y in p] for p in _ROSES_HEADER]
    polys += [[(x / k, y / k + 1366) for x, y in p] for p in _ROSES_CORNER_LEFT]
    polys += [[(x / k + 600, y / k + 1290) for x, y in p] for p in _ROSES_CORNER_RIGHT]
    return polys


def recolor_roses(rgb: np.ndarray, target=ROSE_COLOR, only_roses: bool = False) -> np.ndarray:
    """Cambia el rojo al color indicado conservando luces, sombras y grabado.

    Por defecto recolorea todo el rojo de la imagen; con `only_roses=True`, solo
    dentro de los contornos de las rosas.

    Trabaja en CIELAB: desplaza la luminosidad del rojo de referencia a la del color
    destino y sustituye el tono conservando la intensidad relativa de cada píxel.
    El trazo negro del grabado (sin saturación) no se toca.
    """
    img = rgb.astype(np.uint8)
    mask = Image.new("L", (img.shape[1], img.shape[0]), 0)
    draw = ImageDraw.Draw(mask)
    for poly in rose_polygons():
        draw.polygon(poly, fill=255)
    m = np.asarray(mask.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
    if not only_roses:
        m = np.ones_like(m)
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    h, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    hue_dist = np.minimum(h, 180 - h)
    w = np.clip((sat - 50) / 70, 0, 1) * np.clip((20 - hue_dist) / 10, 0, 1) * np.clip((val - 25) / 40, 0, 1) * m
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB).astype(np.float32)
    L, a, b = lab[..., 0] * 100 / 255, lab[..., 1] - 128, lab[..., 2] - 128
    sel = w > 0.6
    l_ref, c_ref = float(np.median(L[sel])), float(np.median(np.hypot(a[sel], b[sel])))
    t = cv2.cvtColor(np.uint8([[target]]), cv2.COLOR_RGB2LAB)[0, 0].astype(np.float32)
    l_t, a_t, b_t = t[0] * 100 / 255, t[1] - 128, t[2] - 128
    ratio = np.clip(np.hypot(a, b) / max(c_ref, 1.0), 0, 1.6)
    out = np.dstack([np.clip(L + (l_t - l_ref), 0, 100) * 255 / 100, a_t * ratio + 128, b_t * ratio + 128])
    new = cv2.cvtColor(out.clip(0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32)
    return rgb * (1 - w[..., None]) + new * w[..., None]


def load_ref() -> np.ndarray:
    ref = np.asarray(Image.open(REF).convert("RGB")).astype(np.float64)
    return recolor_roses(ref)


def color_to_alpha(rgb: np.ndarray, bg: np.ndarray = PAPER, floor: float = 0.07) -> np.ndarray:
    """Convierte el papel en transparencia (algoritmo "color to alpha").

    Recompuesto sobre el mismo marfil, el resultado es idéntico al original;
    sobre la textura de la app se integra sin halos ni recuadros.
    """
    c = rgb
    up = np.where(c > bg, (c - bg) / np.maximum(255 - bg, 1e-6), 0)
    down = np.where(c < bg, (bg - c) / np.maximum(bg, 1e-6), 0)
    alpha = np.clip(np.max(np.maximum(up, down), axis=2), 0, 1)
    # Elimina el grano del papel (alfas muy bajas) y reescala el resto.
    alpha = np.clip((alpha - floor) / (1 - floor), 0, 1)
    safe = np.maximum(alpha, 1e-6)[..., None]
    fg = np.clip((c - bg) / safe + bg, 0, 255)
    fg[alpha <= 0] = 0
    return np.dstack([fg, alpha * 255]).astype(np.uint8)


def feather_rect(alpha: np.ndarray, box, radius: int = 10) -> np.ndarray:
    """Pone a cero el alfa dentro de `box` (x0, y0, x1, y1) con borde suave."""
    mask = np.zeros(alpha.shape, np.uint8)
    x0, y0, x1, y1 = box
    mask[y0:y1, x0:x1] = 255
    soft = np.asarray(Image.fromarray(mask).filter(ImageFilter.GaussianBlur(radius))) / 255.0
    soft = np.maximum(soft, mask / 255.0)
    return (alpha * (1 - soft)).astype(np.uint8)


def fade_edges(alpha: np.ndarray, top: int = 0, right: int = 0, bottom: int = 0) -> np.ndarray:
    """Desvanece bordes donde el recorte corta el dibujo de forma abrupta."""
    h, w = alpha.shape
    ramp = np.ones((h, w))
    if top:
        ramp *= np.clip(np.arange(h) / top, 0, 1)[:, None]
    if right:
        ramp *= np.clip((w - 1 - np.arange(w)) / right, 0, 1)[None, :]
    if bottom:
        ramp *= np.clip((h - 1 - np.arange(h)) / bottom, 0, 1)[:, None]
    return (alpha * ramp).astype(np.uint8)


def save_rgba(arr: np.ndarray, path: Path, scale: float, quality: int = 88) -> None:
    im = Image.fromarray(arr, "RGBA")
    size = (round(im.width * scale), round(im.height * scale))
    im = im.resize(size, Image.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.relative_to(ROOT)}  {size[0]}×{size[1]}")


def save_rgb(arr: np.ndarray, path: Path, scale: float, quality: int = 86) -> None:
    im = Image.fromarray(arr.astype(np.uint8), "RGB")
    size = (round(im.width * scale), round(im.height * scale))
    im = im.resize(size, Image.LANCZOS)
    im.save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.relative_to(ROOT)}  {size[0]}×{size[1]}")


HEADER_X0 = 360        # recorte del arte del encabezado en la referencia (x 360–956, y 0–800)
HEADER_SCALE = 1.05    # escala del arte en el lienzo de 1080 px

# Palomas (x, y, ancho, alto) medidas en la referencia.
BIRDS = [(429, 251, 24, 27), (472, 258, 26, 27), (453, 297, 25, 25), (426, 336, 25, 26)]

# Rollo de película: puntos medidos en la referencia para modelar su perspectiva.
REEL_HUB = (599.6, 376.0)
REEL_SMALL_HOLES = [(594.5, 337.0), (619.0, 350.6), (621.6, 395.9), (602.9, 418.5), (583.4, 404.9), (577.7, 368.5)]
REEL_BIG_HOLES = {-90: (596.3, 248.7), -30: (668.0, 310.8), 30: (667.4, 444.0), -150: (538.0, 343.6)}
REEL_DISC = (3.72, 3.95)   # radio del disco giratorio (unidades = radio del anillo de agujeros pequeños), con borde suave; más allá ya no es cara del rollo
REEL_TEX = 240            # radio de la textura en px


def fit_reel_homography() -> np.ndarray:
    """Homografía plano del rollo → referencia.

    El rollo está dibujado en perspectiva. Se modela como un disco con 6 agujeros
    pequeños (radio 1) y 6 grandes (radio ρ, desfase δ) y se busca la perspectiva
    que mejor encaja con los agujeros medidos.
    """
    image_pts = [REEL_HUB] + REEL_SMALL_HOLES + list(REEL_BIG_HOLES.values())
    best = None
    for delta in np.arange(-20, 20.5, 1.0):
        for rho in np.arange(2.4, 4.0, 0.02):
            model = [(0.0, 0.0)] + [(np.cos(np.radians(a)), np.sin(np.radians(a))) for a in (-90, -30, 30, 90, 150, 210)]
            model += [(rho * np.cos(np.radians(a + delta)), rho * np.sin(np.radians(a + delta))) for a in REEL_BIG_HOLES]
            H, _ = cv2.findHomography(np.float32(model), np.float32(image_pts), 0)
            proj = cv2.perspectiveTransform(np.float32(model)[None], H)[0]
            err = float(np.sqrt(((proj - np.float32(image_pts)) ** 2).sum(1).mean()))
            if best is None or err < best[0]:
                best = (err, H)
    print(f"  perspectiva del rollo: error medio {best[0]:.1f} px")
    return best[1]


def reel_layers(ref: np.ndarray, art_rgba: np.ndarray) -> dict:
    """Disco giratorio del rollo + capa fija de la rosa que queda delante."""
    H = fit_reel_homography()
    rt = REEL_TEX
    s = rt / REEL_DISC[1]
    # textura (px) → referencia
    T = H @ np.array([[1 / s, 0, -rt / s], [0, 1 / s, -rt / s], [0, 0, 1]])
    size = (2 * rt, 2 * rt)
    tex = cv2.warpPerspective(ref.astype(np.float32), T, size, flags=cv2.WARP_INVERSE_MAP | cv2.INTER_LINEAR)
    yy, xx = np.mgrid[0 : 2 * rt, 0 : 2 * rt]
    rr = np.hypot(xx - rt, yy - rt) / s

    # La rosa tapa parte del rollo: se detecta (rojo) y esa zona de la textura se
    # rellena con el sector vecino del propio rollo (simetría de 60°).
    r, g = tex[..., 0], tex[..., 1]
    red = ((r > g + 45) & (r > 90)).astype(np.uint8)
    red = cv2.morphologyEx(red, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(red)
    occ = np.zeros_like(red)
    for i in range(1, n):
        if stats[i][4] > 400:
            occ[lab == i] = 1
    occ = cv2.dilate(occ, np.ones((7, 7), np.uint8))

    def rot(a: np.ndarray, deg: float, interp=cv2.INTER_LINEAR) -> np.ndarray:
        return cv2.warpAffine(a, cv2.getRotationMatrix2D((rt, rt), deg, 1.0), size, flags=interp)

    occ_p = rot(occ.astype(np.float32), 60, cv2.INTER_NEAREST) < 0.5
    occ_m = rot(occ.astype(np.float32), -60, cv2.INTER_NEAREST) < 0.5
    use_p = (occ > 0) & occ_p
    use_m = (occ > 0) & ~use_p & occ_m
    fill = tex.copy()
    fill[use_p] = rot(tex, 60)[use_p]
    fill[use_m] = rot(tex, -60)[use_m]
    soft = np.asarray(Image.fromarray(((use_p | use_m) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))) / 255.0
    soft = np.maximum(soft, use_p | use_m)
    disc = tex * (1 - soft[..., None]) + fill * soft[..., None]
    disc_alpha = np.clip((REEL_DISC[1] - rr) / (REEL_DISC[1] - REEL_DISC[0]), 0, 1)
    face = np.dstack([np.clip(disc, 0, 255), disc_alpha * 255]).astype(np.uint8)
    Image.fromarray(face, "RGBA").save(ART / "reel-face.webp", "WEBP", quality=90, method=6)
    print(f"  {(ART / 'reel-face.webp').relative_to(ROOT)}  {2 * rt}×{2 * rt}")

    # Capa fija delante del disco: la rosa, solo donde el disco la cubriría.
    crop_h, crop_w = art_rgba.shape[:2]
    to_crop = np.array([[1, 0, -HEADER_X0], [0, 1, 0], [0, 0, 1]]) @ T
    occ_soft = np.asarray(Image.fromarray(occ * 255).filter(ImageFilter.GaussianBlur(1.2))) / 255.0
    front_mask = cv2.warpPerspective((occ_soft * disc_alpha).astype(np.float32), to_crop, (crop_w, crop_h), flags=cv2.INTER_LINEAR)
    front = art_rgba.copy()
    front[..., 3] = (front[..., 3] * np.clip(front_mask * 1.15, 0, 1)).astype(np.uint8)
    save_rgba(front, ART / "reel-front.webp", HEADER_SCALE, quality=90)

    # Matriz CSS (matrix3d) que lleva la textura a su sitio en el arte escalado.
    P = np.array([[HEADER_SCALE, 0, -HEADER_X0 * HEADER_SCALE], [0, HEADER_SCALE, 0], [0, 0, 1]]) @ T
    P = P / P[2, 2]
    matrix = [P[0, 0], P[1, 0], 0, P[2, 0], P[0, 1], P[1, 1], 0, P[2, 1], 0, 0, 1, 0, P[0, 2], P[1, 2], 0, P[2, 2]]
    return {"size": 2 * rt, "matrix": [round(float(v), 9) for v in matrix]}


def bird_layers(art_rgba: np.ndarray) -> tuple[np.ndarray, list]:
    """Separa cada paloma en su propio archivo y la borra del arte fijo."""
    alpha = art_rgba[..., 3].copy()
    birds = []
    for i, (bx, by, bw, bh) in enumerate(BIRDS, start=1):
        pad = 4
        x0, y0 = bx - HEADER_X0 - pad, by - pad
        x1, y1 = bx - HEADER_X0 + bw + pad, by + bh + pad
        box = alpha[y0:y1, x0:x1]
        n, lab, stats, _ = cv2.connectedComponentsWithStats((box > 40).astype(np.uint8))
        keep = 1 + int(np.argmax(stats[1:, 4]))  # la silueta es el componente mayor
        m = cv2.dilate((lab == keep).astype(np.uint8), np.ones((3, 3), np.uint8))
        sprite = art_rgba[y0:y1, x0:x1].copy()
        sprite[..., 3] = (sprite[..., 3] * m).astype(np.uint8)
        name = f"bird-{i}.webp"
        save_rgba(sprite, ART / name, HEADER_SCALE * 2, quality=92)
        birds.append({
            "file": name,
            "left": round(x0 * HEADER_SCALE, 2),
            "top": round(y0 * HEADER_SCALE, 2),
            "width": round((x1 - x0) * HEADER_SCALE, 2),
            "height": round((y1 - y0) * HEADER_SCALE, 2),
        })
        # Borra la paloma del arte fijo (está sobre papel limpio).
        erase = cv2.dilate(m, np.ones((5, 5), np.uint8)) > 0
        box[erase] = 0
    out = art_rgba.copy()
    out[..., 3] = alpha
    return out, birds


def header_art(ref: np.ndarray) -> None:
    """Rollo de película, rosas, aves y catedral del encabezado, en capas animables."""
    import json

    x0, y0, x1, y1 = HEADER_X0, 0, 956, 800
    rgba = color_to_alpha(ref[y0:y1, x0:x1])
    a = rgba[..., 3]
    # Quita el bloque del logotipo FICM y su filete (x < 400 entre y 100 y 360).
    a = feather_rect(a, (0, 100, 400 - x0, 362), 4)
    # Quita el titular "Bienvenido al FICM" y el texto de apoyo (x < 494).
    a = feather_rect(a, (0, 462, 494 - x0, 732), 5)
    # Quita lo que queda bajo las tarjetas (la app las dibuja encima).
    a = feather_rect(a, (0, 772, 910 - x0, 800), 3)
    a = fade_edges(a, bottom=46)
    rgba[..., 3] = a

    # Versión fija (la aprobada, con palomas) y base sin palomas para la animación.
    save_rgba(rgba, ART / "header-art.webp", HEADER_SCALE)
    reel = reel_layers(ref, rgba)
    static, birds = bird_layers(rgba)
    save_rgba(static, ART / "header-art-base.webp", HEADER_SCALE)
    layers = {
        "_nota": "Generado por design/tools/extract_assets.py. Coordenadas en px del arte del encabezado.",
        "art": {"width": round((x1 - x0) * HEADER_SCALE), "height": round((y1 - y0) * HEADER_SCALE)},
        "reel": reel,
        "birds": birds,
    }
    (ART / "header-layers.json").write_text(json.dumps(layers, indent=2, ensure_ascii=False) + "\n")
    print(f"  {(ART / 'header-layers.json').relative_to(ROOT)}")


def corner_art(ref: np.ndarray) -> None:
    """Rosas, hojas y película de las esquinas inferiores."""
    # Esquina inferior izquierda.
    x0, y0, x1, y1 = 0, 1366, 400, 1645
    rgba = color_to_alpha(ref[y0:y1, x0:x1])
    a = rgba[..., 3]
    a = feather_rect(a, (318 - x0, 0, 400 - x0, 1542 - y0), 4)   # arco del logo Naranti
    a = feather_rect(a, (220 - x0, 1412 - y0, 400 - x0, 1436 - y0), 3)  # filete
    a = fade_edges(a, top=22, right=26)
    rgba[..., 3] = a
    save_rgba(rgba, ART / "corner-left.webp", K)

    # Esquina inferior derecha (incluye la tira de película que sube).
    x0, y0, x1, y1 = 600, 1290, 956, 1645
    rgba = color_to_alpha(ref[y0:y1, x0:x1])
    a = rgba[..., 3]
    a = feather_rect(a, (0, 0, 645 - x0, 1545 - y0), 4)           # letras del logo Naranti
    a = feather_rect(a, (0, 1410 - y0, 735 - x0, 1438 - y0), 3)   # filete
    rgba[..., 3] = a
    save_rgba(rgba, ART / "corner-right.webp", K)


# Tarjetas: recuadro de la foto y zonas con icono / título / flecha a borrar.
CARDS = {
    "sedes": {
        "box": (486, 777, 910, 1090),
        "erase": [(516, 910, 600, 1016), (512, 1000, 690, 1086), (798, 1000, 896, 1100)],
    },
    "secciones": {
        "box": (47, 1104, 629, 1363),
        "erase": [(76, 1196, 174, 1296), (74, 1278, 348, 1362), (510, 1280, 610, 1362)],
    },
}


def card_photos(ref: np.ndarray) -> None:
    """Fotografías de las tarjetas sin el icono, el título ni la flecha."""
    img = ref.astype(np.uint8)
    for name, spec in CARDS.items():
        mask = np.zeros(img.shape[:2], np.uint8)
        for (x0, y0, x1, y1) in spec["erase"]:
            # Trazos blancos o grises (los tres canales altos): no toca los rojos.
            region = img[y0:y1, x0:x1].min(axis=2)
            mask[y0:y1, x0:x1] = np.where(region > 52, 255, 0).astype(np.uint8)
        mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
        bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        fixed = cv2.inpaint(bgr, mask, 9, cv2.INPAINT_TELEA)
        fixed = cv2.cvtColor(fixed, cv2.COLOR_BGR2RGB)
        x0, y0, x1, y1 = spec["box"]
        crop = np.ascontiguousarray(fixed[y0:y1, x0:x1])
        # Las esquinas redondeadas de la referencia dejan papel marfil: se rellenan
        # con la foto para que cualquier radio de borde en CSS quede limpio.
        h, w = crop.shape[:2]
        r = 34
        corners = np.zeros((h, w), np.uint8)
        yy, xx = np.mgrid[0:h, 0:w]
        for cx, cy in ((r, r), (w - 1 - r, r), (r, h - 1 - r), (w - 1 - r, h - 1 - r)):
            near = (np.abs(xx - cx) <= r) & (np.abs(yy - cy) <= r)
            outside = ((xx - cx) * (np.sign(xx - cx)) > 0) & ((yy - cy) * np.sign(yy - cy) > 0)
            corners[near & outside & ((xx - cx) ** 2 + (yy - cy) ** 2 > (r - 6) ** 2)] = 255
        crop_bgr = cv2.cvtColor(crop, cv2.COLOR_RGB2BGR)
        crop = cv2.cvtColor(cv2.inpaint(crop_bgr, corners, 7, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
        save_rgb(crop, PHOTOS / f"{name}.webp", K)


def ficm_logo(ref: np.ndarray) -> None:
    """Logotipo FICM (emblema + "24° Festival Internacional de Cine de Morelia")."""
    x0, y0, x1, y1 = 48, 104, 402, 310
    rgba = color_to_alpha(ref[y0:y1, x0:x1], floor=0.12)
    save_rgba(rgba, BRAND / "ficm-logo.webp", K * 1.5)


def paper_tile() -> None:
    """Textura de papel: ruido suave en mosaico, sin filtros en tiempo real."""
    rng = np.random.default_rng(2026)
    size = 256
    fine = rng.normal(0, 1, (size, size))
    coarse = cv2.resize(rng.normal(0, 1, (32, 32)), (size, size), interpolation=cv2.INTER_CUBIC)
    # Envoltura periódica para que el mosaico no muestre juntas.
    coarse = (coarse + np.roll(coarse, size // 2, 0) + np.roll(coarse, size // 2, 1)) / 3
    n = fine * 0.55 + coarse * 0.8
    n = (n - n.mean()) / n.std()
    base = np.array([245.0, 241.0, 232.0])
    rgb = np.clip(base + n[..., None] * np.array([3.2, 3.2, 3.6]), 0, 255)
    save_rgb(rgb, ART / "paper-tile.webp", 1.0, quality=80)


def cinepolis_white(src: Path) -> None:
    """Versión en negativo (blanca) del logotipo recibido, sin redibujarlo."""
    import shutil

    BRAND.mkdir(parents=True, exist_ok=True)
    original = BRAND / f"cinepolis-logo-original{src.suffix.lower()}"
    shutil.copyfile(src, original)
    im = Image.open(src)
    rgba = np.asarray(im.convert("RGBA")).astype(np.float64)
    border = np.concatenate([rgba[:8, :, :3].reshape(-1, 3), rgba[-8:, :, :3].reshape(-1, 3),
                             rgba[:, :8, :3].reshape(-1, 3), rgba[:, -8:, :3].reshape(-1, 3)])
    if rgba[..., 3].min() < 250:
        alpha = rgba[..., 3]  # ya tiene transparencia
    elif border.mean() < 200:
        # Logotipo blanco sobre fondo de color (p. ej. azul Cinépolis): la
        # opacidad sale del canal donde más se distingue el blanco del fondo.
        bg = np.median(border, axis=0)
        ch = int(np.argmin(bg))
        alpha = np.clip((rgba[..., ch] - bg[ch]) / max(255.0 - bg[ch], 1.0), 0, 1) * 255
        alpha[alpha < 0.18 * 255] = 0  # elimina el degradado / viñeta del fondo
    else:
        # Fondo blanco → transparencia proporcional a la "tinta".
        alpha = color_to_alpha(rgba[..., :3], bg=np.array([255.0, 255.0, 255.0]), floor=0.04)[..., 3].astype(np.float64)
        # La tinta (azul marino) queda 100 % opaca; los bordes conservan su suavizado.
        ink = alpha[alpha > 0]
        if ink.size:
            alpha = alpha * (255.0 / max(np.percentile(ink, 99.5), 1.0))
    out = np.zeros(rgba.shape, np.uint8)
    out[..., :3] = 255
    out[..., 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    ys, xs = np.where(out[..., 3] > 8)
    pad = 4
    out = out[max(ys.min() - pad, 0): ys.max() + pad + 1, max(xs.min() - pad, 0): xs.max() + pad + 1]
    dest = BRAND / "cinepolis-logo-white.webp"
    Image.fromarray(out, "RGBA").save(dest, "WEBP", lossless=True)
    print(f"  {original.relative_to(ROOT)}  (original intacto)")
    print(f"  {dest.relative_to(ROOT)}  {out.shape[1]}×{out.shape[0]}")


def main() -> None:
    import sys

    if len(sys.argv) == 3 and sys.argv[1] == "--cinepolis":
        cinepolis_white(Path(sys.argv[2]).resolve())
        return
    for d in (ART, PHOTOS, BRAND):
        d.mkdir(parents=True, exist_ok=True)
    ref = load_ref()
    print("Generando recursos desde", REF.relative_to(ROOT))
    header_art(ref)
    corner_art(ref)
    card_photos(ref)
    ficm_logo(ref)
    paper_tile()


if __name__ == "__main__":
    main()
