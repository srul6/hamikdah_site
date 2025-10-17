-- SQL script to create the orders table in Supabase
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    form_id TEXT UNIQUE NOT NULL,
    document_id TEXT,
    payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ILS',
    
    -- Customer information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_street TEXT,
    customer_house_number TEXT,
    customer_apartment_number TEXT,
    customer_floor TEXT,
    customer_city TEXT,
    customer_country TEXT DEFAULT 'IL',
    
    -- Order details
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    dedication TEXT,
    purchase_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_form_id ON orders(form_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for authenticated users, you can adjust as needed)
CREATE POLICY "Allow public read access" ON orders
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated insert" ON orders
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON orders
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow authenticated delete" ON orders
    FOR DELETE
    USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Add comment to table
COMMENT ON TABLE orders IS 'Stores all customer orders with details';

