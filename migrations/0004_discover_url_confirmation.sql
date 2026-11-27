-- URL discovery: persist the source product image and explicit user confirmation state.
ALTER TABLE discovery_references ADD COLUMN extracted_image_url TEXT;
ALTER TABLE discovery_references ADD COLUMN confirmation_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (confirmation_status IN ('pending', 'confirmed'));
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0004_discover_url_confirmation');
