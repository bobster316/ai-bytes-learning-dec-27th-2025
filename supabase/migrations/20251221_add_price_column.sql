
-- 20251221_add_price_column.sql
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;
