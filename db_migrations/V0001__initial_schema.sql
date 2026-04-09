CREATE TABLE t_p21225702_cyber_secretary_app.clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  case_number TEXT NOT NULL,
  status TEXT NOT NULL,
  next_date TEXT NOT NULL DEFAULT '',
  total_billed INTEGER NOT NULL DEFAULT 0,
  last_contact TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  investigator TEXT NOT NULL DEFAULT '',
  investigator_phone TEXT NOT NULL DEFAULT '',
  investigator_office TEXT NOT NULL DEFAULT '',
  agency TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21225702_cyber_secretary_app.tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  time TEXT NOT NULL,
  client TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  urgent BOOLEAN NOT NULL DEFAULT FALSE,
  task_date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21225702_cyber_secretary_app.investigations (
  id SERIAL PRIMARY KEY,
  client TEXT NOT NULL,
  action TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21225702_cyber_secretary_app.deadlines (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  client TEXT NOT NULL,
  days_left INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21225702_cyber_secretary_app.client_history (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES t_p21225702_cyber_secretary_app.clients(id),
  note TEXT NOT NULL,
  event_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
