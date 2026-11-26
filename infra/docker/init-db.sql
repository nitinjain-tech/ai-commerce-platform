-- Initialize databases and users for AI Commerce Platform

-- Create runtime user (non-superuser) for strict RLS enforcement
CREATE USER commerce_app WITH PASSWORD 'commerce_app_secret';

-- Create test database
CREATE DATABASE commerce_test_db;

-- Grant permissions on primary database
GRANT CONNECT ON DATABASE commerce_db TO commerce_app;
GRANT USAGE ON SCHEMA public TO commerce_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO commerce_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO commerce_app;

-- Grant permissions on test database
\connect commerce_test_db;
GRANT CONNECT ON DATABASE commerce_test_db TO commerce_app;
GRANT USAGE ON SCHEMA public TO commerce_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO commerce_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO commerce_app;
