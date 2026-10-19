import sqlite3
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = ROOT / "backend" / "app" / "db" / "schema.sql"


class DatabaseSchemaTest(unittest.TestCase):
    def setUp(self):
        self.connection = sqlite3.connect(":memory:")
        self.connection.execute("PRAGMA foreign_keys = ON")
        self.connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

    def tearDown(self):
        self.connection.close()

    def test_expected_tables_are_created(self):
        rows = self.connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table'"
        ).fetchall()
        names = {row[0] for row in rows}
        expected = {
            "versions",
            "champions",
            "traits",
            "trait_levels",
            "champion_traits",
            "items",
            "item_recipe_components",
            "lineups",
            "lineup_traits",
            "lineup_champions",
            "lineup_items",
            "sources",
        }
        self.assertTrue(expected.issubset(names))

    def test_version_unique_constraint(self):
        sql = (
            "INSERT INTO versions "
            "(season_code, season_name, version_code, snapshot_date, status) "
            "VALUES ('S18', '自然之力', '18.4', '2026-10-19', 'pilot')"
        )
        self.connection.execute(sql)
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(sql)

    def test_foreign_keys_are_enforced(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.connection.execute(
                """
                INSERT INTO champions
                    (version_id, stable_id, name, cost, source_url,
                     collected_at, verification_status)
                VALUES (999, 'missing_version', '测试英雄', 1,
                        'https://example.com', '2026-10-19', 'partial')
                """
            )


if __name__ == "__main__":
    unittest.main()
