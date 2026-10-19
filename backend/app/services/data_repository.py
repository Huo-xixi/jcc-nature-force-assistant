from __future__ import annotations

import json
from pathlib import Path


class JsonDataRepository:
    """Read-only repository for one immutable data snapshot."""

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.metadata = self._load("versions.json")
        self.champions = self._load("champions.json")
        self.traits = self._load("traits.json")
        self.items = self._load("items.json")
        self.lineups = self._load("lineups.json")
        self.champion_by_id = {row["id"]: row for row in self.champions}
        self.trait_by_id = {row["id"]: row for row in self.traits}
        self.item_by_id = {row["id"]: row for row in self.items}

    def _load(self, filename: str):
        with (self.data_dir / filename).open(encoding="utf-8") as file:
            return json.load(file)

    def summary(self) -> dict:
        return {
            "dataset_id": self.metadata["dataset_id"],
            "season": self.metadata["season"],
            "version": self.metadata["version"],
            "champions": len(self.champions),
            "traits": len(self.traits),
            "items": len(self.items),
            "lineups": len(self.lineups),
        }
