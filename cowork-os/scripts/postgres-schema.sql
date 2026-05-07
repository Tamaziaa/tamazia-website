-- Tamazia n8n cold pipeline · Postgres schema v1
-- Apply on first VPS boot via: docker exec -i tamazia-postgres psql -U n8n -d n8n < postgres-schema.sql

CREATE TABLE IF NOT EXISTS aliases (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(64) NOT NULL,
  persona_name VARCHAR(128) NOT NULL,
  first_name VARCHAR(64) NOT NULL,
  user_owner VARCHAR(32),
  warmup_day INT DEFAULT 0,
  day_quota INT DEFAULT 2,
  status VARCHAR(16) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  sector VARCHAR(64) NOT NULL,
  contact_first VARCHAR(64),
  contact_last VARCHAR(64),
  contact_title VARCHAR(128),
  email VARCHAR(255),
  phone VARCHAR(64),
  city VARCHAR(64),
  product_line VARCHAR(128),
  programme VARCHAR(128),
  research_dossier TEXT,
  status VARCHAR(32) DEFAULT 'new',
  source VARCHAR(64),
  imported_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_sector_idx ON leads(sector);

CREATE TABLE IF NOT EXISTS sends (
  id SERIAL PRIMARY KEY,
  alias_id INT REFERENCES aliases(id),
  lead_id INT REFERENCES leads(id),
  recipient VARCHAR(255),
  smtp_relay VARCHAR(32),
  subject VARCHAR(255),
  message_id VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  delivery_status VARCHAR(32) DEFAULT 'sent',
  opened_at TIMESTAMP,
  replied_at TIMESTAMP,
  kind VARCHAR(16) DEFAULT 'cold',
  sequence_step VARCHAR(16),
  thread_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS sends_alias_sent_idx ON sends(alias_id, sent_at);
CREATE INDEX IF NOT EXISTS sends_recipient_idx ON sends(recipient);
CREATE INDEX IF NOT EXISTS sends_thread_idx ON sends(thread_id);

CREATE TABLE IF NOT EXISTS suppression (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(64),
  suppressed_at TIMESTAMP DEFAULT NOW(),
  source_send_id INT REFERENCES sends(id)
);

CREATE TABLE IF NOT EXISTS health_check (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(64),
  postmaster_data_json JSONB,
  alias_bounce_summary_json JSONB,
  spam_rate NUMERIC(5,2),
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smtp_relays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(32) UNIQUE NOT NULL,
  daily_quota INT,
  sent_today INT DEFAULT 0,
  weight INT DEFAULT 1,
  healthy BOOLEAN DEFAULT TRUE,
  last_failure_at TIMESTAMP,
  last_health_check TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequences (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES leads(id),
  current_step INT DEFAULT 0,
  step_history JSONB DEFAULT '[]',
  status VARCHAR(32) DEFAULT 'active',
  paused_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed SMTP relays with weights
INSERT INTO smtp_relays (name, daily_quota, weight, healthy) VALUES
  ('resend',  1000, 4, TRUE),
  ('brevo',    300, 3, TRUE),
  ('mailjet',  200, 2, TRUE),
  ('sendgrid', 100, 1, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Master kill switch
CREATE TABLE IF NOT EXISTS system_state (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO system_state (key, value) VALUES ('paused', 'false') ON CONFLICT (key) DO NOTHING;
