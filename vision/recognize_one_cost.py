"""Recognize S18 one-cost champions in five fixed MuMu shop slots.

The recognizer is deliberately small and auditable: Pillow + NumPy only,
fixed geometry, local artwork templates, cost-frame filtering and normalized
cross-correlation. Unknown/non-one-cost slots are never forced to a class.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "vision/configs/emulator-shop-1920x1092.json"
DEFAULT_MANIFEST = ROOT / "vision/one_cost_manifest.json"
RESAMPLING = getattr(Image, "Resampling", Image).LANCZOS


@dataclass(frozen=True)
class Template:
    champion_id: str
    name: str
    rgb: np.ndarray
    edge: np.ndarray


def _cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), RESAMPLING)
    left = max(0, (resized.width - target_w) // 2)
    top = max(0, (resized.height - target_h) // 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def _features(image: Image.Image, size: tuple[int, int] = (96, 60)) -> tuple[np.ndarray, np.ndarray]:
    # The game shop stretches the full poster into the card artwork area.
    # Match that rendering instead of using a center-cover crop.
    fitted = image.convert("RGB").resize(size, RESAMPLING)
    # Trait badges obscure the left side of shop artwork. The right 62% keeps
    # the champion face/body and is stable between the source poster and card.
    fitted = fitted.crop((round(size[0] * 0.38), 0, size[0], round(size[1] * 0.92)))
    fitted = ImageEnhance.Contrast(fitted).enhance(1.08)
    rgb = np.asarray(fitted, dtype=np.float32) / 255.0
    gray = np.asarray(fitted.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32) / 255.0
    return rgb, gray


def _ncc(left: np.ndarray, right: np.ndarray) -> float:
    a = left.reshape(-1).astype(np.float32)
    b = right.reshape(-1).astype(np.float32)
    a -= float(a.mean())
    b -= float(b.mean())
    denominator = float(np.linalg.norm(a) * np.linalg.norm(b))
    return 0.0 if denominator < 1e-8 else float(np.dot(a, b) / denominator)


def _similarity(slot_rgb: np.ndarray, slot_edge: np.ndarray, template: Template) -> float:
    color_score = _ncc(slot_rgb, template.rgb)
    edge_score = _ncc(slot_edge, template.edge)
    return 0.72 * color_score + 0.28 * edge_score


def _one_cost_frame_score(slot: Image.Image) -> float:
    """Estimate whether the shop frame is the neutral gray one-cost frame.

    Higher-cost cards have strongly green/blue/purple/gold saturated borders.
    We sample thin frame strips while excluding the artwork and text body.
    """
    rgb = np.asarray(slot.convert("RGB"), dtype=np.float32) / 255.0
    # The footer background is neutral gray for one-cost cards and strongly
    # green/blue/purple/gold for higher costs. Ignore text and coin highlights
    # by using the mean saturation over the full footer band.
    footer = rgb[130:165, 5:-5].reshape(-1, 3)
    maximum = footer.max(axis=1)
    minimum = footer.min(axis=1)
    saturation = (maximum - minimum) / np.maximum(maximum, 1e-6)
    mean_saturation = float(saturation.mean())
    return max(0.0, min(1.0, (0.72 - mean_saturation) / 0.35))


def load_templates(manifest_path: Path) -> list[Template]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    templates: list[Template] = []
    for champion in manifest["champions"]:
        path = ROOT / "vision" / champion["template"]
        if not path.exists():
            raise FileNotFoundError(f"缺少模板：{path}")
        with Image.open(path) as image:
            rgb, edge = _features(image)
        templates.append(Template(str(champion["id"]), champion["name"], rgb, edge))
    return templates


def recognize(
    screenshot_path: Path,
    config_path: Path = DEFAULT_CONFIG,
    manifest_path: Path = DEFAULT_MANIFEST,
    match_threshold: float = 0.34,
    margin_threshold: float = 0.08,
    frame_threshold: float = 0.60,
) -> dict[str, Any]:
    with Image.open(screenshot_path) as source:
        screenshot = source.convert("RGB")
    return recognize_image(
        screenshot,
        screenshot_label=str(screenshot_path.resolve()),
        config_path=config_path,
        manifest_path=manifest_path,
        match_threshold=match_threshold,
        margin_threshold=margin_threshold,
        frame_threshold=frame_threshold,
    )


def recognize_image(
    screenshot: Image.Image,
    screenshot_label: str = "uploaded-image",
    config_path: Path = DEFAULT_CONFIG,
    manifest_path: Path = DEFAULT_MANIFEST,
    match_threshold: float = 0.34,
    margin_threshold: float = 0.08,
    frame_threshold: float = 0.60,
) -> dict[str, Any]:
    config = json.loads(config_path.read_text(encoding="utf-8"))
    templates = load_templates(manifest_path)
    screenshot = screenshot.convert("RGB")
    expected = config["environment"]["game_content_size_px"]
    expected_size = (expected["width"], expected["height"])
    if screenshot.size != expected_size:
        raise ValueError(f"截图分辨率应为 {expected_size[0]}x{expected_size[1]}，实际为 {screenshot.width}x{screenshot.height}")

    results = []
    for region in config["regions"]:
        x, y, width, height = region["rect_xywh"]
        slot = screenshot.crop((x, y, x + width, y + height))
        artwork = slot.crop((6, 5, width - 4, min(126, height)))
        slot_rgb, slot_edge = _features(artwork)
        ranked = sorted(
            ((template, _similarity(slot_rgb, slot_edge, template)) for template in templates),
            key=lambda pair: pair[1],
            reverse=True,
        )
        best_template, best_score = ranked[0]
        second_score = ranked[1][1]
        margin = best_score - second_score
        frame_score = _one_cost_frame_score(slot)
        accepted = best_score >= match_threshold and margin >= margin_threshold and frame_score >= frame_threshold
        results.append({
            "region": region["id"],
            "kind": "champion",
            "id": best_template.champion_id if accepted else None,
            "name": best_template.name if accepted else "未知",
            "confidence": round(max(0.0, min(1.0, (best_score + 1.0) / 2.0)), 4),
            "accepted": accepted,
            "reason": "one_cost_match" if accepted else "below_threshold_or_non_one_cost",
            "diagnostics": {
                "similarity": round(best_score, 4),
                "runner_up_margin": round(margin, 4),
                "one_cost_frame_score": round(frame_score, 4),
                "runner_up": ranked[1][0].name,
            },
        })

    return {
        "schema_version": 1,
        "mode": "one_cost_template_match",
        "season": config["season"],
        "version": config["version"],
        "screenshot": screenshot_label,
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="识别 MuMu 商店中的 S18 一费英雄")
    parser.add_argument("screenshot", type=Path, help="1920x1092 PNG/JPG 截图")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--match-threshold", type=float, default=0.34)
    parser.add_argument("--margin-threshold", type=float, default=0.08)
    parser.add_argument("--frame-threshold", type=float, default=0.60)
    args = parser.parse_args()
    output = recognize(
        args.screenshot,
        args.config,
        args.manifest,
        args.match_threshold,
        args.margin_threshold,
        args.frame_threshold,
    )
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
