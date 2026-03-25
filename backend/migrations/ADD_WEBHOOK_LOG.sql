-- Idempotent webhook delivery log (survives process restarts).
-- Used to avoid double-processing (inventory, emails) when Green Invoice retries the same event.

CREATE TABLE IF NOT EXISTS webhook_log (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(512) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT webhook_log_webhook_id_key UNIQUE (webhook_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_processed_at ON webhook_log (processed_at);

COMMENT ON TABLE webhook_log IS 'Green Invoice (and similar) webhook dedupe keys; insert-on-claim pattern in application code';
