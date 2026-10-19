import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.data_repository import JsonDataRepository  # noqa: E402
from app.services.recommendation import RecommendationService  # noqa: E402


class RecommendationServiceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_dir = ROOT / "data" / "processed" / "s18_18_4"
        cls.repository = JsonDataRepository(data_dir)
        cls.service = RecommendationService(cls.repository)

    def test_dataset_summary(self):
        self.assertEqual(self.repository.summary()["version"], "18.4")
        self.assertEqual(self.repository.summary()["lineups"], 10)

    def test_recommendation_contains_explainable_breakdown(self):
        result = self.service.recommend(
            champion_ids=["3509", "4500", "1511"],
            item_ids=["recurve_bow", "needlessly_large_rod", "giants_belt", "giants_belt"],
            top_k=1,
        )[0]
        self.assertEqual(result["lineup_name"], "7野怪鸡哥")
        self.assertGreater(result["score"], 0)
        self.assertIn("champion_match", result["breakdown"])
        self.assertIn("鬼索的狂暴之刃", result["craftable_recommended_items"])
        self.assertIn("狂徒铠甲", result["craftable_recommended_items"])

    def test_full_roster_ranks_matching_lineup_first(self):
        result = self.service.recommend(
            champion_ids=["1507", "2512", "2502", "2503", "1502", "1501", "4509", "3506"],
            item_ids=["bf_sword", "sparring_gloves", "bf_sword", "tear_of_the_goddess"],
            top_k=3,
        )
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["lineup_name"], "射箭韦鲁斯")
        self.assertGreater(result[0]["score"], result[1]["score"])

    def test_top_ten_returns_ten_distinct_lineups(self):
        result = self.service.recommend(champion_ids=[], item_ids=[], top_k=10)
        self.assertEqual(len(result), 10)
        self.assertEqual(len({row["lineup_id"] for row in result}), 10)


if __name__ == "__main__":
    unittest.main()
