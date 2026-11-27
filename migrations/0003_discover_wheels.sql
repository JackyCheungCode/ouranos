-- Discover Wheels: isolated intake and matching records.
-- Existing catalogue tables remain the canonical OURANOS product source.

CREATE TABLE IF NOT EXISTS discovery_jobs (
  id TEXT PRIMARY KEY,
  input_type TEXT NOT NULL CHECK (input_type IN ('image', 'url')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  source_url TEXT,
  reference_object_key TEXT,
  reference_mime_type TEXT,
  reference_size_bytes INTEGER,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_discovery_jobs_status_created
  ON discovery_jobs(status, created_at);

CREATE TABLE IF NOT EXISTS discovery_references (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES discovery_jobs(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('image', 'url')),
  source_url TEXT,
  source_domain TEXT,
  extracted_title TEXT,
  extracted_brand TEXT,
  extracted_model TEXT,
  extracted_specs_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discovery_references_job
  ON discovery_references(job_id);

CREATE TABLE IF NOT EXISTS discovery_matches (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES discovery_jobs(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'visual_similar', 'specification_similar')),
  similarity_score REAL,
  explanation TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, product_id, match_type)
);

CREATE INDEX IF NOT EXISTS idx_discovery_matches_job_score
  ON discovery_matches(job_id, match_type, similarity_score DESC);

-- Keep the application's migration ledger in sync with Wrangler's D1 migration history.
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0003_discover_wheels');
