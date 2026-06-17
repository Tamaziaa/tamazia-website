-- TRACKING FOUNDATION · form_submissions
-- Raw, append-only log of EVERY website form submission, written by
-- functions/_lib/neon-sync.js::syncFormSubmission() (called from functions/api/contact.js,
-- which also backs /api/audit-request). This is the source of truth for submission tracking
-- and attribution; it is DISTINCT from the shared `leads` table (syncLeadToNeon de-dupes
-- sales/newsletter leads there). Additive-only and idempotent — safe to run repeatedly.
--
-- PII note: email/name/company are stored server-side only (never placed in any URL). The IP is
-- stored as a salted SHA-256 hash (env.IP_HASH_SALT) — the raw address is never persisted.
--
-- Apply:  psql "$NEON_URL" -f docs/neon-form-submissions-schema.sql

CREATE TABLE IF NOT EXISTS form_submissions (
  id          BIGSERIAL PRIMARY KEY,
  form_type   TEXT,                         -- contact | audit | briefings | ... (the form "tab")
  name        TEXT,
  email       TEXT,
  company     TEXT,
  message     TEXT,
  page_url    TEXT,
  audit_slug  TEXT,                          -- set when the submission came from a minted /audit/<slug>
  utm         JSONB DEFAULT '{}'::jsonb,     -- { utm_source, utm_medium, utm_campaign, utm_term, utm_content }
  ip_hash     TEXT,                          -- salted SHA-256 of the client IP (never the raw IP)
  request_id  TEXT,                          -- the server-minted request id (joins to the KV record)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- request_id is added defensively for any pre-existing table created from the original brief DDL
-- (which omitted it); harmless when the column already exists.
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Reporting helpers (idempotent).
CREATE INDEX IF NOT EXISTS idx_form_submissions_created   ON form_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email     ON form_submissions (lower(email));
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON form_submissions (form_type);
