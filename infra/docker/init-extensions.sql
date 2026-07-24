-- Extensões exigidas pela spec (docs/prd/02, §1): geo p/ matching e vetores p/ RAG
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
