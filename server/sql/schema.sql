-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id           BIGSERIAL PRIMARY KEY,
  cuisine      VARCHAR(200),
  title        VARCHAR(500) NOT NULL,
  rating       DOUBLE PRECISION,
  prep_time    INTEGER,
  cook_time    INTEGER,
  total_time   INTEGER,
  description  TEXT,
  nutrients    JSONB,
  serves       VARCHAR(100)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_recipes_rating_desc ON recipes (rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm ON recipes USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes (cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_nutrients_gin ON recipes USING GIN (nutrients);
