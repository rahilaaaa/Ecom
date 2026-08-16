SELECT id, title, enable_variants, price_in_inr, price_in_inr_enabled, _status
FROM products
WHERE deleted_at IS NULL
ORDER BY id;

SELECT v.id, v.title, v.product_id, v.price_in_inr, v.price_in_inr_enabled, v._status
FROM variants v
WHERE v.deleted_at IS NULL
ORDER BY v.product_id, v.id;

SELECT c.id, c.subtotal, c.currency, jsonb_pretty(to_jsonb(c.items)) AS items
FROM carts c
ORDER BY c.id
LIMIT 20;
