-- PostgreSQL initialisation script
-- Runs once when the container is first created.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- enables fast LIKE / ILIKE queries
