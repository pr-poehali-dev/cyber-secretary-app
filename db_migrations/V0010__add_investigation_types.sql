CREATE TABLE t_p21225702_cyber_secretary_app.investigation_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    rate INTEGER NOT NULL DEFAULT 3000,
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p21225702_cyber_secretary_app.investigation_types (name, rate, sort_order) VALUES
  ('допрос',       3500, 1),
  ('обыск',        5000, 2),
  ('очная ставка', 4000, 3),
  ('экспертиза',   4500, 4),
  ('ознакомление', 2500, 5),
  ('суд',          5000, 6);
