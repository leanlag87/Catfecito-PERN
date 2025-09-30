
-- Enum para roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
  END IF;
END$$;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role             user_role NOT NULL DEFAULT 'user',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_name_len CHECK (char_length(name) >= 2),
  CONSTRAINT chk_password_len CHECK (char_length(password_hash) >= 8)
);

-- Unicidad por email en minúsculas (defensa adicional)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
  ON users (lower(email));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_users ON users;
CREATE TRIGGER trg_set_updated_at_usuarios
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
