-- Renumber orders.id to contiguous 1..N and reset orders_id_seq.
-- Run against Neon when you are ready (backup / snapshot recommended).
--
-- Why IDs jump today:
--   orders.id DEFAULT nextval('orders_id_seq')
--   PostgreSQL sequences never reuse values after DELETE or failed INSERT.
--   The "next id" lives in orders_id_seq, NOT in MAX(id) of the table.
--
-- Safe here: no foreign keys reference orders.id.

BEGIN;

CREATE TEMP TABLE order_id_remap AS
SELECT
    id AS old_id,
    ROW_NUMBER() OVER (ORDER BY id ASC)::int AS new_id
FROM orders;

-- Avoid primary-key collisions while remapping
UPDATE orders SET id = id + 1000000;

UPDATE orders o
SET id = r.new_id
FROM order_id_remap r
WHERE o.id = r.old_id + 1000000;

-- Next nextval() returns MAX(id) + 1
SELECT setval(
    'orders_id_seq',
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM orders), 1),
    true
);

COMMIT;

-- Verify:
-- SELECT COUNT(*), MIN(id), MAX(id) FROM orders;
-- SELECT last_value, is_called FROM orders_id_seq;
