SELECT 'CREATE DATABASE pong_ping_api'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'pong_ping_api'
)\gexec
