import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from vision.recognize_one_cost import recognize  # noqa: E402


FIXTURES = Path(__file__).resolve().parent / "fixtures"


class OneCostRecognitionTests(unittest.TestCase):
    def test_varus_and_leona_are_recognized_without_forcing_higher_cost_cards(self):
        rows = recognize(FIXTURES / "varus-leona.png")["results"]
        self.assertEqual([rows[0]["name"], rows[1]["name"]], ["韦鲁斯", "蕾欧娜"])
        self.assertTrue(rows[0]["accepted"])
        self.assertTrue(rows[1]["accepted"])
        self.assertEqual([row["name"] for row in rows[2:]], ["未知", "未知", "未知"])

    def test_veigar_and_sentry_are_recognized(self):
        rows = recognize(FIXTURES / "veigar-sentry.png")["results"]
        self.assertEqual([row["name"] for row in rows[:3]], ["维迦", "维迦", "苍蓝哨戒"])
        self.assertTrue(all(row["accepted"] for row in rows[:3]))
        self.assertEqual([row["name"] for row in rows[3:]], ["未知", "未知"])

    def test_wrong_resolution_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "截图分辨率应为"):
            recognize(ROOT / "vision/templates/s18_18_4/one_cost_dataj/varus.jpg")


if __name__ == "__main__":
    unittest.main()
