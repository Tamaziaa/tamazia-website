-- Tamazia audit commerce + intake · Neon (Postgres) schema
-- ============================================================================
-- Two tables back the audit report's commerce flow:
--   audit_intents  · every intake-modal submission (tier / one-time fix / add-on enquiry)
--   addon_orders   · paid Stripe add-on subscriptions (populated by the webhook once live)
--
-- audit_intents is also created on demand by functions/api/intent.js (it runs CREATE TABLE
-- IF NOT EXISTS on its first insert), so the first lead is never lost. Running this file by
-- hand is the clean, indexed setup and is recommended before launch.
--
-- addon_orders is NOT auto-created. Run it by hand when the Stripe keys are bound, so no
-- empty table appears in prod before checkout is live.
--
-- Apply with: psql "$NEON_URL" -f docs/neon-commerce-schema.sql
-- The Neon HTTP /sql endpoint used by the Functions runs one statement per call; psql here
-- runs the whole file in order. Every statement is idempotent (IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- 1. audit_intents · intake-modal submissions
--    intent is free TEXT: a tier (foundation|authority|enterprise), one_time_fix,
--    or an add-on key (geo, cold_email, compliance, linkedin, reputation, entity,
--    gbp_dom, reg_alerts, ymyl). No enum, so a new add-on never needs a migration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_intents (
  id            BIGSERIAL PRIMARY KEY,
  intent        TEXT NOT NULL,              -- tier | one_time_fix | add-on key
  firm_name     TEXT,
  domain        TEXT,
  sector        TEXT,
  jurisdictions TEXT,
  locations     TEXT,                       -- locations / scale
  revenue_band  TEXT,
  goal          TEXT,                       -- goal / pain / trigger
  buyer_role    TEXT,
  timeline      TEXT,
  audit_domain  TEXT,                       -- domain of the audit the modal opened from
  audit_slug    TEXT,
  top_finding   TEXT,
  ip_country    TEXT,
  referer       TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_intents_created_idx ON audit_intents (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_intents_intent_idx  ON audit_intents (intent);

-- ---------------------------------------------------------------------------
-- 2. addon_orders · paid Stripe add-on subscriptions
--    Written by functions/api/stripe/webhook.js on checkout.session.completed.
--    Idempotent on the Stripe session id (a retried webhook never double-inserts).
--    GO-LIVE DEP: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET + STRIPE_PRICE_* (none set yet).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addon_orders (
  id              BIGSERIAL PRIMARY KEY,
  stripe_session  TEXT UNIQUE,              -- Checkout Session id (idempotency key)
  stripe_customer TEXT,
  subscription    TEXT,
  addon_key       TEXT,
  addon_name      TEXT,
  audit_domain    TEXT,
  company         TEXT,
  customer_email  TEXT,
  amount_total    INTEGER,                  -- minor units (pence)
  currency        TEXT,
  status          TEXT,                     -- e.g. 'complete'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addon_orders_created_idx ON addon_orders (created_at DESC);
