from __future__ import annotations

from collections import Counter

from .data_repository import JsonDataRepository


class RecommendationService:
    """Transparent baseline ranker for the course prototype."""

    def __init__(self, repository: JsonDataRepository):
        self.repository = repository

    def recommend(
        self, champion_ids: list[str], item_ids: list[str], top_k: int = 3
    ) -> list[dict]:
        owned_champions = set(champion_ids)
        owned_items = Counter(item_ids)
        results = [
            self._score_lineup(lineup, owned_champions, owned_items)
            for lineup in self.repository.lineups
        ]
        results.sort(key=lambda row: row["score"], reverse=True)
        return results[:top_k]

    def _score_lineup(
        self, lineup: dict, owned_champions: set[str], owned_items: Counter
    ) -> dict:
        slots = lineup["champions"]
        lineup_champion_ids = {slot["champion_id"] for slot in slots}
        champion_ratio = len(owned_champions & lineup_champion_ids) / len(lineup_champion_ids)

        owned_traits = {
            trait_id
            for champion_id in owned_champions
            if champion_id in self.repository.champion_by_id
            for trait_id in self.repository.champion_by_id[champion_id]["traits"]
        }
        lineup_traits = set(lineup["traits"])
        trait_metadata_complete = all(
            self.repository.champion_by_id[champion_id]["traits"]
            for champion_id in lineup_champion_ids
        )
        if trait_metadata_complete:
            trait_ratio = len(owned_traits & lineup_traits) / max(len(lineup_traits), 1)
            trait_explanation = (
                f"已覆盖主要羁绊 {len(owned_traits & lineup_traits)}/{len(lineup_traits)} 个。"
            )
        else:
            trait_ratio = champion_ratio
            trait_explanation = "英雄个人羁绊尚未完整核验，本项暂按阵容成员覆盖率估算。"

        recommended_ids = {
            item_id
            for slot in slots
            for item_id in slot["recommended_item_ids"]
        }
        craftable = sorted(
            item_id
            for item_id in recommended_ids
            if self._can_build(item_id, owned_items)
        )
        directly_owned = recommended_ids & set(owned_items)
        available = directly_owned | set(craftable)
        item_ratio = len(available) / max(len(recommended_ids), 1)

        stats = lineup["meta_stats"]
        meta_ratio = min(1.0, 0.7 * stats["top4_rate"] + 0.3 * stats["win_rate"])
        breakdown = {
            "champion_match": round(45 * champion_ratio, 2),
            "item_fit": round(25 * item_ratio, 2),
            "trait_coverage": round(20 * trait_ratio, 2),
            "meta_strength": round(10 * meta_ratio, 2),
        }
        total = round(sum(breakdown.values()), 2)

        missing_core_ids = [
            slot["champion_id"]
            for slot in slots
            if slot["is_core"] and slot["champion_id"] not in owned_champions
        ]
        missing_core_names = [
            self.repository.champion_by_id[champion_id]["name"]
            for champion_id in missing_core_ids
        ]
        craftable_names = [self.repository.item_by_id[item_id]["name"] for item_id in craftable]
        explanation = [
            f"已拥有阵容中的 {len(owned_champions & lineup_champion_ids)}/{len(lineup_champion_ids)} 名英雄。",
            trait_explanation,
            f"现有装备可直接满足或合成 {len(available)}/{len(recommended_ids)} 件推荐成装。",
        ]
        if missing_core_names:
            explanation.append("仍缺少核心英雄：" + "、".join(missing_core_names) + "。")

        return {
            "lineup_id": lineup["id"],
            "lineup_name": lineup["name"],
            "score": total,
            "breakdown": breakdown,
            "missing_core_champions": missing_core_names,
            "craftable_recommended_items": craftable_names,
            "explanation": explanation,
        }

    def _can_build(self, item_id: str, owned_items: Counter) -> bool:
        item = self.repository.item_by_id[item_id]
        recipe = Counter(item["components"])
        return all(owned_items[component_id] >= count for component_id, count in recipe.items())
