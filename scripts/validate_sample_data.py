"""Validate cross-file integrity for the S18 18.4 pilot dataset."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "processed" / "s18_18_4"
EXPECTED_SEASON = "S18"
EXPECTED_VERSION = "18.4"


def load(name: str):
    with (DATA_DIR / name).open(encoding="utf-8") as file:
        return json.load(file)


def index(records: list[dict], label: str, errors: list[str]) -> dict[str, dict]:
    result: dict[str, dict] = {}
    for record in records:
        record_id = record.get("id")
        if not record_id:
            errors.append(f"{label}: record without id")
        elif record_id in result:
            errors.append(f"{label}: duplicate id {record_id}")
        else:
            result[record_id] = record
    return result


def validate_version(record: dict, label: str, errors: list[str]) -> None:
    if record.get("season") != EXPECTED_SEASON:
        errors.append(f"{label}: season must be {EXPECTED_SEASON}")
    if record.get("version") != EXPECTED_VERSION:
        errors.append(f"{label}: version must be {EXPECTED_VERSION}")
    for field in ("source_url", "collected_at", "verification_status"):
        if not record.get(field):
            errors.append(f"{label}: missing {field}")


def validate() -> list[str]:
    errors: list[str] = []
    metadata = load("versions.json")
    champions = load("champions.json")
    traits = load("traits.json")
    items = load("items.json")
    lineups = load("lineups.json")

    if metadata.get("season") != EXPECTED_SEASON or metadata.get("version") != EXPECTED_VERSION:
        errors.append("versions.json: dataset version does not match validator")

    champion_by_id = index(champions, "champion", errors)
    trait_by_id = index(traits, "trait", errors)
    item_by_id = index(items, "item", errors)
    index(lineups, "lineup", errors)

    for champion in champions:
        label = f"champion {champion.get('id')}"
        validate_version(champion, label, errors)
        if champion.get("cost") not in range(1, 6):
            errors.append(f"{label}: cost must be between 1 and 5")
        for trait_id in champion.get("traits", []):
            if trait_id not in trait_by_id:
                errors.append(f"{label}: unknown trait {trait_id}")

    for trait in traits:
        validate_version(trait, f"trait {trait.get('id')}", errors)

    for item in items:
        label = f"item {item.get('id')}"
        validate_version(item, label, errors)
        components = item.get("components", [])
        if item.get("kind") == "component" and components:
            errors.append(f"{label}: component item cannot have a recipe")
        if item.get("kind") == "completed" and len(components) != 2:
            errors.append(f"{label}: completed item must have two components")
        for component_id in components:
            component = item_by_id.get(component_id)
            if not component:
                errors.append(f"{label}: unknown component {component_id}")
            elif component.get("kind") != "component":
                errors.append(f"{label}: recipe references non-component {component_id}")

    for lineup in lineups:
        label = f"lineup {lineup.get('id')}"
        validate_version(lineup, label, errors)
        for trait_id in lineup.get("traits", []):
            if trait_id not in trait_by_id:
                errors.append(f"{label}: unknown trait {trait_id}")
        for slot in lineup.get("champions", []):
            champion_id = slot.get("champion_id")
            if champion_id not in champion_by_id:
                errors.append(f"{label}: unknown champion {champion_id}")
            if slot.get("position") not in {"front", "middle", "back"}:
                errors.append(f"{label}: invalid position for {champion_id}")
            for item_id in slot.get("recommended_item_ids", []):
                item = item_by_id.get(item_id)
                if not item:
                    errors.append(f"{label}: unknown item {item_id}")
                elif item.get("kind") != "completed":
                    errors.append(f"{label}: recommendation references component {item_id}")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("Data validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    counts = {
        name: len(load(name))
        for name in ("champions.json", "traits.json", "items.json", "lineups.json")
    }
    print(
        "Data validation passed: "
        f"{counts['champions.json']} champions, "
        f"{counts['traits.json']} traits, "
        f"{counts['items.json']} items, "
        f"{counts['lineups.json']} lineups."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
