CREATE TABLE IF NOT EXISTS wheel_inquiries (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  product_model TEXT NOT NULL,
  construction TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wheel_inquiries_created_at ON wheel_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_wheel_inquiries_product_id ON wheel_inquiries(product_id);
