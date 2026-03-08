-- Fix orders table sequence if it's out of sync
-- Run this in Neon SQL Editor if you get "duplicate key value violates unique constraint" errors

-- Check current sequence value
SELECT currval('orders_id_seq');

-- Check max ID in table
SELECT MAX(id) FROM orders;

-- Reset sequence to be higher than max ID
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1), true);

-- Verify sequence is now correct
SELECT currval('orders_id_seq');


