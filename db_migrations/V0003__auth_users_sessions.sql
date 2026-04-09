CREATE TABLE t_p21225702_cyber_secretary_app.users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  notify_email TEXT NOT NULL DEFAULT '',
  notify_days_before INTEGER[] NOT NULL DEFAULT '{1,3}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE t_p21225702_cyber_secretary_app.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p21225702_cyber_secretary_app.users(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_sessions_token ON t_p21225702_cyber_secretary_app.sessions(token);
CREATE INDEX idx_sessions_user_id ON t_p21225702_cyber_secretary_app.sessions(user_id);
