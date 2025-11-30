-- Create tables for Neon PostgreSQL database
-- Run this in Neon SQL Editor after setting up your project

-- ===== PRODUCTS TABLE =====
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name_he TEXT,
    name_en TEXT,
    description_he TEXT,
    description_en TEXT,
    price DECIMAL(10, 2),
    quantity INTEGER DEFAULT 0,
    homepageimage TEXT,
    extraimages TEXT,
    buildingtime TEXT,
    pieces TEXT,
    height TEXT,
    length TEXT,
    width TEXT,
    recommendedage TEXT,
    children_playing TEXT,
    desktop_hero_images TEXT,
    colors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== CART TABLE =====
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== COMMENTS TABLE =====
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    name_he TEXT,
    name_en TEXT,
    text_he TEXT,
    text_en TEXT,
    type TEXT DEFAULT 'text', -- 'text', 'video', 'image'
    video_url TEXT,
    image_url TEXT,
    rating INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== ORDERS TABLE =====
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    form_id TEXT UNIQUE,
    document_id TEXT,
    payment_id TEXT,
    status TEXT DEFAULT 'pending',
    amount DECIMAL(10, 2),
    currency TEXT DEFAULT 'ILS',
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_street TEXT,
    customer_house_number TEXT,
    customer_apartment_number TEXT,
    customer_floor TEXT,
    customer_city TEXT,
    customer_country TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    dedication TEXT,
    purchase_timestamp TIMESTAMP,
    is_shipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_id ON comments(id);
CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id);
CREATE INDEX IF NOT EXISTS idx_orders_form_id ON orders(form_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ===== TRIGGERS FOR UPDATED_AT =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== GRANT PERMISSIONS =====
-- Make sure your Neon user has proper permissions
-- This is usually handled automatically by Neon

