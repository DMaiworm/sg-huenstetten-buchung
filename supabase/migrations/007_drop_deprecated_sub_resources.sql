-- Migration 007: Drop deprecated sub_resources table
--
-- Sub-resources were copied into the resources table (with parent_resource_id)
-- in migration 006. The sub_resources table is no longer read by any hook
-- (useFacilities uses buildConfigResources() which queries only resources).
--
-- No foreign keys reference this table, confirmed before dropping.

DROP TABLE IF EXISTS sub_resources;
