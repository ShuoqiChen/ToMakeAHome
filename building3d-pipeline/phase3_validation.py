"""
Phase 3 — Structural Analysis

Composites Phase 1 (2D analysis) with Phase 2 (depth map) to derive the
structural parameters that drive the Blender rebuild:

  wall_height_m       — estimated metric height of the facade
  roof_type           — flat / shed / gabled / hipped / pyramidal
  roof_pitch_deg      — slope angle in degrees
  footprint           — normalised XY polygon (Blender XY plane)
  window_positions_3d — 3-D world positions of detected windows
  door_position_3d    — 3-D world position of the main door

Visual outputs (images only, no charts):
  analysis_overlay.png  — labelled region boxes on the original building image
  footprint.png         — top-down footprint polygon derived from depth
  depth_heatmap.png     — depth colourmap (written by Phase 2, kept here for reference)
  pointcloud.html       — interactive 3-D scatter (Plotly, written if available)
"""

import json
from pathlib import Path

import cv2
import numpy as np

ANALYSIS_DIR = Path(__file__).parent / "analysis"
GATES_DIR    = ANALYSIS_DIR / "gates"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_depth(analysis_dir: Path) -> np.ndarray:
    return np.load(str(analysis_dir / "depth.npy"))


def _load_segments(analysis_dir: Path) -> list:
    p = analysis_dir / "segments.json"
    if p.exists():
        with open(p) as f:
            return json.load(f)
    return []


# ---------------------------------------------------------------------------
# Visual 1 — labelled region overlay on original image
# ---------------------------------------------------------------------------

LABEL_COLORS = {
    "roof":       (255, 200,   0),   # amber
    "wall":       ( 80, 200, 255),   # sky blue
    "window":     (  0, 230, 120),   # green
    "door":       (255,  80,  80),   # red
    "decoration": (200, 160, 255),   # lavender
    "unknown":    (200, 200, 200),
}

def save_analysis_overlay(analysis: dict, img_path: Path, out_dir: Path):
    """
    Draw labelled bounding boxes on the original cleaned building image.
    Each box is colour-coded by region type (roof / wall / window / door).
    """
    img = cv2.imread(str(img_path))
    if img is None:
        print("  [Phase 3] image not found for overlay — skipping")
        return

    for seg in analysis.get("segments", []):
        x, y, bw, bh = [int(v) for v in seg["bbox"]]
        label = seg.get("label", "unknown")
        color = LABEL_COLORS.get(label, (200, 200, 200))
        cv2.rectangle(img, (x, y), (x + bw, y + bh), color, 2)
        # Label background chip
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(img, (x, max(y - th - 6, 0)), (x + tw + 6, max(y - 1, 0)), color, -1)
        cv2.putText(img, label, (x + 3, max(y - 3, th)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (20, 20, 20), 1, cv2.LINE_AA)

    # Legend
    lx, ly = 10, 10
    for lbl, col in LABEL_COLORS.items():
        if lbl == "unknown":
            continue
        cv2.rectangle(img, (lx, ly), (lx + 14, ly + 14), col, -1)
        cv2.putText(img, lbl, (lx + 18, ly + 11),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, (230, 230, 230), 1, cv2.LINE_AA)
        ly += 20

    out = out_dir / "analysis_overlay.png"
    cv2.imwrite(str(out), img)
    print(f"  [Phase 3] region overlay → {out.name}")


# ---------------------------------------------------------------------------
# Visual 2 — top-down footprint from depth
# ---------------------------------------------------------------------------

def compute_and_save_footprint(depth: np.ndarray, out_dir: Path) -> list:
    """
    Project depth to a top-down view, extract a footprint polygon,
    and save a clean CV2 visualisation.
    Returns footprint as list of [x, z] normalised pairs.
    """
    h, w = depth.shape
    scale = 1.0 / max(h, w)

    # Collect near-points row by row
    pts = []
    for row_idx in range(0, h, 4):
        row = depth[row_idx, :]
        thresh = float(np.percentile(row, 30))
        near_cols = np.where(row < thresh)[0]
        if near_cols.size:
            z = (row_idx - h / 2) * scale
            pts.append([(near_cols.min() - w / 2) * scale, z])
            pts.append([(near_cols.max() - w / 2) * scale, z])

    pts = np.array(pts) if pts else np.zeros((4, 2))

    # Convex hull polygon
    footprint: list
    if len(pts) >= 3:
        from scipy.spatial import ConvexHull
        try:
            hull = ConvexHull(pts)
            footprint = pts[hull.vertices].tolist()
        except Exception:
            footprint = pts.tolist()
    else:
        footprint = pts.tolist()

    # Draw clean top-down view
    img_sz = 400
    margin = 30
    fp = np.array(footprint) if footprint else pts
    if fp.shape[0] >= 2:
        mn, mx = fp.min(0), fp.max(0)
        rng = mx - mn
        rng[rng == 0] = 1.0
        canvas = np.full((img_sz, img_sz, 3), 30, np.uint8)
        def to_px(pt):
            nx = (pt[0] - mn[0]) / rng[0]
            nz = (pt[1] - mn[1]) / rng[1]
            return (int(margin + nx * (img_sz - 2*margin)),
                    int(margin + nz * (img_sz - 2*margin)))

        poly_px = np.array([to_px(p) for p in fp], np.int32)
        cv2.polylines(canvas, [poly_px], True, (0, 220, 200), 2)
        cv2.fillPoly(canvas, [poly_px], (0, 80, 70))
        cv2.polylines(canvas, [poly_px], True, (0, 220, 200), 2)
        # Vertices
        for p in poly_px:
            cv2.circle(canvas, tuple(p), 4, (255, 200, 0), -1)
        cv2.putText(canvas, "Top-down footprint", (10, img_sz - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (150, 150, 150), 1)
    else:
        canvas = np.full((img_sz, img_sz, 3), 30, np.uint8)

    cv2.imwrite(str(out_dir / "footprint.png"), canvas)
    print(f"  [Phase 3] footprint ({len(footprint)} vertices) → footprint.png")
    return footprint


# ---------------------------------------------------------------------------
# Visual 3 — interactive point cloud (optional)
# ---------------------------------------------------------------------------

def save_pointcloud_html(analysis_dir: Path, out_dir: Path):
    try:
        import plotly.graph_objects as go
    except ImportError:
        return

    pc_path = analysis_dir / "pointcloud.json"
    if not pc_path.exists():
        return

    with open(pc_path) as f:
        pc = json.load(f)

    fig = go.Figure(data=[go.Scatter3d(
        x=pc["x"], y=pc["y"], z=pc["z"],
        mode="markers",
        marker=dict(size=2, color=pc["color"], opacity=0.8),
    )])
    fig.update_layout(
        title="Building Point Cloud",
        scene=dict(xaxis_title="X", yaxis_title="Y", zaxis_title="Z", aspectmode="data"),
        margin=dict(l=0, r=0, b=0, t=40),
    )
    out = out_dir / "pointcloud.html"
    fig.write_html(str(out))
    print(f"  [Phase 3] interactive point cloud → {out.name}")


# ---------------------------------------------------------------------------
# Structural parameter estimators
# ---------------------------------------------------------------------------

def _compute_region_depths(segments: list, depth: np.ndarray) -> dict:
    from collections import defaultdict
    h, w = depth.shape
    rd = defaultdict(list)
    for seg in segments:
        x, y, bw, bh = seg["bbox"]
        x1, y1 = max(0, int(x)), max(0, int(y))
        x2, y2 = min(w, int(x + bw)), min(h, int(y + bh))
        patch = depth[y1:y2, x1:x2]
        if patch.size > 0:
            rd[seg["label"]].append(float(patch.mean()))
    return {k: round(float(np.mean(v)), 3) for k, v in rd.items()}


def _estimate_wall_height(depth: np.ndarray) -> float:
    """
    Estimate wall height in metres from Depth Pro metric depth.
    Depth Pro returns absolute metric depth, so we can use the
    vertical extent of the depth range as a proxy.
    """
    h, w = depth.shape
    focal_px = max(w, h) * 0.85           # rough — Depth Pro gives ~1745px for 1024 images
    roof_row  = int(h * 0.15)
    base_row  = int(h * 0.85)
    roof_d  = float(np.median(depth[roof_row, w//4:3*w//4]))
    base_d  = float(np.median(depth[base_row, w//4:3*w//4]))
    avg_d   = (roof_d + base_d) / 2.0
    pixel_span = base_row - roof_row       # pixels
    height_m = (pixel_span / focal_px) * avg_d
    return round(float(np.clip(height_m, 2.5, 30.0)), 2)


def _estimate_roof(analysis: dict, depth: np.ndarray) -> tuple:
    """Estimate roof pitch and type from Hough lines in the upper image zone."""
    lines = analysis.get("hough_lines", [])
    h, _ = depth.shape

    if not lines:
        return 25.0, "gabled"

    roof_lines = [l for l in lines if (l[1] + l[3]) / 2 < h * 0.35]
    if not roof_lines:
        return 10.0, "flat"

    angles = []
    for x1, y1, x2, y2 in roof_lines:
        dx = x2 - x1
        if dx != 0:
            angles.append(abs(np.degrees(np.arctan((y2 - y1) / dx))))

    if not angles:
        return 25.0, "gabled"

    med = float(np.median(angles))
    if med < 8:    return med, "flat"
    elif med < 20: return med, "shed"
    elif med < 40: return med, "gabled"
    else:          return med, "hipped"


def _project_windows_to_3d(analysis: dict, depth: np.ndarray, wall_h: float) -> list:
    h, w = depth.shape
    out = []
    for i, (bbox, cen) in enumerate(zip(
            analysis.get("window_bbox_2d", []),
            analysis.get("window_centroids_2d", []))):
        cx, cy = cen
        bw, bh = bbox[2], bbox[3]
        nx = (cx - w / 2) / w
        ny = (cy - h / 2) / h
        z_m = float(depth[int(np.clip(cy, 0, h-1)), int(np.clip(cx, 0, w-1))])
        out.append({
            "id": i,
            "x": round(nx * wall_h * (w / h), 3),
            "y": round(wall_h * (0.5 - ny * 1.5), 3),
            "z": 0.0,
            "width":  round(bw / w * wall_h * (w / h), 3),
            "height": round(bh / h * wall_h, 3),
            "depth_m": round(z_m, 3),
        })
    return out


def _project_door_to_3d(analysis: dict, depth: np.ndarray, wall_h: float):
    door = analysis.get("door_bbox_2d")
    if not door:
        return None
    h, w = depth.shape
    x, y, bw, bh = door
    cx = x + bw / 2
    nx = (cx - w / 2) / w
    return {
        "x": round(nx * wall_h * (w / h), 3),
        "y": round(bh / h * wall_h / 2, 3),
        "z": 0.0,
        "width":  round(bw / w * wall_h * (w / h), 3),
        "height": round(bh / h * wall_h, 3),
    }


# ---------------------------------------------------------------------------
# Top-level runner
# ---------------------------------------------------------------------------

def run_validation_gates(analysis: dict, depth_result: dict,
                          img_path=None, analysis_dir=None) -> dict:
    if analysis_dir is None:
        analysis_dir = ANALYSIS_DIR
    analysis_dir = Path(analysis_dir)

    gates_dir = analysis_dir / "gates"
    gates_dir.mkdir(parents=True, exist_ok=True)

    depth = depth_result.get("depth")
    if depth is None:
        depth = _load_depth(analysis_dir)

    segments = analysis.get("segments", _load_segments(analysis_dir))
    analysis.setdefault("segments", segments)

    clean_img = Path(img_path) if img_path else (analysis_dir.parent / "input" / "building_clean.png")

    print("[Phase 3] Deriving structural parameters...")

    # Visuals
    save_analysis_overlay(analysis, clean_img, gates_dir)
    footprint = compute_and_save_footprint(depth, gates_dir)
    save_pointcloud_html(analysis_dir, gates_dir)

    # Structural estimates
    region_depths      = _compute_region_depths(segments, depth)
    wall_h             = _estimate_wall_height(depth)
    roof_pitch, r_type = _estimate_roof(analysis, depth)
    windows_3d         = _project_windows_to_3d(analysis, depth, wall_h)
    door_3d            = _project_door_to_3d(analysis, depth, wall_h)

    analysis.update({
        "footprint":           footprint,
        "wall_height_m":       wall_h,
        "roof_pitch_deg":      round(roof_pitch, 1),
        "roof_type":           r_type,
        "window_positions_3d": windows_3d,
        "door_position_3d":    door_3d,
        "region_depths":       region_depths,
    })

    print(f"  wall_height: {wall_h} m  |  roof: {r_type} @ {roof_pitch:.1f}°")
    print(f"  windows: {len(windows_3d)}  |  footprint: {len(footprint)} vertices")

    out_path = analysis_dir / "building_analysis.json"
    with open(out_path, "w") as f:
        serialisable = {k: v for k, v in analysis.items() if k != "segments"}
        json.dump(serialisable, f, indent=2)
    print(f"[Phase 3] Saved → {out_path}")

    return analysis
