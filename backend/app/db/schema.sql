PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY,
    season_code TEXT NOT NULL,
    season_name TEXT NOT NULL,
    version_code TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pilot', 'active', 'archived')),
    UNIQUE (season_code, version_code)
);

CREATE TABLE IF NOT EXISTS champions (
    id INTEGER PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    stable_id TEXT NOT NULL,
    name TEXT NOT NULL,
    cost INTEGER NOT NULL CHECK (cost BETWEEN 1 AND 5),
    skill_name TEXT NOT NULL DEFAULT '',
    role_tags_json TEXT NOT NULL DEFAULT '[]',
    source_url TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    UNIQUE (version_id, stable_id)
);

CREATE TABLE IF NOT EXISTS traits (
    id INTEGER PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    stable_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('origin', 'class')),
    source_url TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    UNIQUE (version_id, stable_id)
);

CREATE TABLE IF NOT EXISTS trait_levels (
    id INTEGER PRIMARY KEY,
    trait_id INTEGER NOT NULL REFERENCES traits(id) ON DELETE CASCADE,
    required_count INTEGER NOT NULL CHECK (required_count > 0),
    effect_summary TEXT NOT NULL,
    UNIQUE (trait_id, required_count)
);

CREATE TABLE IF NOT EXISTS champion_traits (
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    trait_id INTEGER NOT NULL REFERENCES traits(id) ON DELETE CASCADE,
    PRIMARY KEY (champion_id, trait_id)
);

CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    stable_id TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('component', 'completed', 'special')),
    effect_summary TEXT NOT NULL DEFAULT '',
    role_tags_json TEXT NOT NULL DEFAULT '[]',
    source_url TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    UNIQUE (version_id, stable_id)
);

CREATE TABLE IF NOT EXISTS item_recipe_components (
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (item_id, component_id),
    CHECK (item_id <> component_id)
);

CREATE TABLE IF NOT EXISTS lineups (
    id INTEGER PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    stable_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tier TEXT,
    avg_placement REAL CHECK (avg_placement BETWEEN 1 AND 8),
    pick_rate REAL CHECK (pick_rate >= 0),
    win_rate REAL CHECK (win_rate BETWEEN 0 AND 1),
    top4_rate REAL CHECK (top4_rate BETWEEN 0 AND 1),
    sample_count INTEGER CHECK (sample_count > 0),
    notes TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    UNIQUE (version_id, stable_id)
);

CREATE TABLE IF NOT EXISTS lineup_traits (
    lineup_id INTEGER NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
    trait_id INTEGER NOT NULL REFERENCES traits(id) ON DELETE RESTRICT,
    PRIMARY KEY (lineup_id, trait_id)
);

CREATE TABLE IF NOT EXISTS lineup_champions (
    lineup_id INTEGER NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE RESTRICT,
    board_position TEXT NOT NULL CHECK (board_position IN ('front', 'middle', 'back')),
    is_core INTEGER NOT NULL DEFAULT 0 CHECK (is_core IN (0, 1)),
    target_star INTEGER NOT NULL DEFAULT 2 CHECK (target_star BETWEEN 1 AND 3),
    PRIMARY KEY (lineup_id, champion_id)
);

CREATE TABLE IF NOT EXISTS lineup_items (
    lineup_id INTEGER NOT NULL,
    champion_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 3),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (lineup_id, champion_id, item_id),
    FOREIGN KEY (lineup_id, champion_id)
        REFERENCES lineup_champions(lineup_id, champion_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (
        entity_type IN ('version', 'champion', 'trait', 'item', 'lineup')
    ),
    entity_stable_id TEXT NOT NULL,
    url TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    collection_method TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    UNIQUE (version_id, entity_type, entity_stable_id, url)
);

CREATE INDEX IF NOT EXISTS idx_champions_version_cost
    ON champions(version_id, cost);
CREATE INDEX IF NOT EXISTS idx_champions_name
    ON champions(name);
CREATE INDEX IF NOT EXISTS idx_items_version_kind
    ON items(version_id, kind);
CREATE INDEX IF NOT EXISTS idx_items_name
    ON items(name);
CREATE INDEX IF NOT EXISTS idx_lineups_version_tier
    ON lineups(version_id, tier);
CREATE INDEX IF NOT EXISTS idx_lineup_champions_champion
    ON lineup_champions(champion_id);
CREATE INDEX IF NOT EXISTS idx_sources_entity
    ON sources(version_id, entity_type, entity_stable_id);
