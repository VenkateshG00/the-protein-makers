-- ============================================
-- THE PROTEIN MAKERS — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop existing objects if re-running (safe to ignore errors on first run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS subscription_calendar CASCADE;
DROP TABLE IF EXISTS subscription_meals CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;
DROP TABLE IF EXISTS meal_plan_items CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS payment_transaction_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS calendar_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS duration_type CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS meal_time CASCADE;
DROP TYPE IF EXISTS meal_type_enum CASCADE;
DROP TYPE IF EXISTS dietary_tag CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'staff', 'kitchen', 'customer', 'delivery');
CREATE TYPE dietary_tag AS ENUM ('veg', 'non_veg', 'egg');
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'add_on');
CREATE TYPE meal_time AS ENUM ('morning', 'afternoon', 'dinner');
CREATE TYPE plan_type AS ENUM ('fixed', 'customized');
CREATE TYPE duration_type AS ENUM ('weekly', 'monthly', 'six_day');
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'paused', 'expired', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE calendar_status AS ENUM ('scheduled', 'paused', 'prepared', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'failed', 'cancelled');
CREATE TYPE payment_transaction_status AS ENUM ('pending', 'successful', 'failed', 'refunded');
CREATE TYPE discount_type AS ENUM ('percentage', 'flat');

-- ============================================
-- TABLES
-- ============================================

-- Users (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone VARCHAR(15),
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meals
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  protein_grams DECIMAL(6,1) NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  ingredients TEXT,
  photo_url TEXT,
  dietary_tag dietary_tag NOT NULL DEFAULT 'non_veg',
  meal_type meal_type_enum NOT NULL DEFAULT 'lunch',
  preparation_time_minutes INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meal Plans
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  plan_type plan_type NOT NULL,
  duration_type duration_type NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meal Plan Items (for fixed plans)
CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES meals(id),
  day_number INTEGER NOT NULL,
  meal_time meal_time NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Delivery Zones
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_delivery_threshold DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Addresses
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  landmark TEXT,
  city VARCHAR(100) NOT NULL DEFAULT 'Hyderabad',
  pincode VARCHAR(10) NOT NULL,
  delivery_zone_id UUID NOT NULL REFERENCES delivery_zones(id),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id),
  address_id UUID NOT NULL REFERENCES customer_addresses(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status subscription_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_id UUID REFERENCES coupons(id),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription Meals (for customized plans)
CREATE TABLE subscription_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES meals(id),
  meal_time meal_time NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Subscription Calendar
CREATE TABLE subscription_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status calendar_status NOT NULL DEFAULT 'scheduled',
  pause_group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, date)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(20) UNIQUE NOT NULL,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  calendar_id UUID NOT NULL REFERENCES subscription_calendar(id),
  order_date DATE NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_person_id UUID REFERENCES users(id),
  delivery_zone_id UUID NOT NULL REFERENCES delivery_zones(id),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES meals(id),
  meal_time meal_time NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  payment_method VARCHAR(50),
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  status payment_transaction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_meals_category ON meals(category_id);
CREATE INDEX idx_meals_dietary ON meals(dietary_tag);
CREATE INDEX idx_meals_type ON meals(meal_type);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscription_calendar_date ON subscription_calendar(date);
CREATE INDEX idx_subscription_calendar_sub ON subscription_calendar(subscription_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_person ON orders(delivery_person_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_categories BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_meals BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_meal_plans BEFORE UPDATE ON meal_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_delivery_zones BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_subscription_calendar BEFORE UPDATE ON subscription_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()::uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- USERS policies
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (id = auth.uid()::uuid);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid()::uuid);
CREATE POLICY "Admin/staff can read all users" ON users FOR SELECT USING (get_user_role() IN ('admin', 'staff'));
CREATE POLICY "Admin can update any user" ON users FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admin can insert users" ON users FOR INSERT WITH CHECK (true);

-- CATEGORIES policies (public read)
CREATE POLICY "Anyone can read active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can read all categories" ON categories FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admin can manage categories" ON categories FOR ALL USING (get_user_role() = 'admin');

-- MEALS policies (public read for active)
CREATE POLICY "Anyone can read active meals" ON meals FOR SELECT USING (is_active = true AND is_available = true);
CREATE POLICY "Admin can read all meals" ON meals FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admin can manage meals" ON meals FOR ALL USING (get_user_role() = 'admin');

-- MEAL PLANS policies
CREATE POLICY "Anyone can read active plans" ON meal_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can read all plans" ON meal_plans FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admin can manage plans" ON meal_plans FOR ALL USING (get_user_role() = 'admin');

-- MEAL PLAN ITEMS policies
CREATE POLICY "Anyone can read plan items" ON meal_plan_items FOR SELECT USING (true);
CREATE POLICY "Admin can manage plan items" ON meal_plan_items FOR ALL USING (get_user_role() = 'admin');

-- DELIVERY ZONES policies
CREATE POLICY "Anyone can read active zones" ON delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage zones" ON delivery_zones FOR ALL USING (get_user_role() = 'admin');

-- CUSTOMER ADDRESSES policies
CREATE POLICY "Users can manage own addresses" ON customer_addresses FOR ALL USING (user_id = auth.uid()::uuid);
CREATE POLICY "Admin/staff can read all addresses" ON customer_addresses FOR SELECT USING (get_user_role() IN ('admin', 'staff'));

-- SUBSCRIPTIONS policies
CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can create subscriptions" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (user_id = auth.uid()::uuid);
CREATE POLICY "Admin/staff can read all subscriptions" ON subscriptions FOR SELECT USING (get_user_role() IN ('admin', 'staff'));
CREATE POLICY "Admin can manage subscriptions" ON subscriptions FOR ALL USING (get_user_role() = 'admin');

-- SUBSCRIPTION MEALS policies
CREATE POLICY "Users can manage own sub meals" ON subscription_meals FOR ALL USING (
  EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_meals.subscription_id AND s.user_id = auth.uid()::uuid)
);
CREATE POLICY "Admin can manage sub meals" ON subscription_meals FOR ALL USING (get_user_role() IN ('admin', 'staff'));

-- SUBSCRIPTION CALENDAR policies
CREATE POLICY "Users can read own calendar" ON subscription_calendar FOR SELECT USING (
  EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_calendar.subscription_id AND s.user_id = auth.uid()::uuid)
);
CREATE POLICY "Users can update own calendar" ON subscription_calendar FOR UPDATE USING (
  EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_calendar.subscription_id AND s.user_id = auth.uid()::uuid)
);
CREATE POLICY "Admin/staff can manage calendar" ON subscription_calendar FOR ALL USING (get_user_role() IN ('admin', 'staff'));

-- ORDERS policies
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Admin/staff can read all orders" ON orders FOR SELECT USING (get_user_role() IN ('admin', 'staff'));
CREATE POLICY "Admin/staff can manage orders" ON orders FOR ALL USING (get_user_role() IN ('admin', 'staff'));
CREATE POLICY "Delivery can read assigned orders" ON orders FOR SELECT USING (
  delivery_person_id = auth.uid()::uuid AND get_user_role() = 'delivery'
);
CREATE POLICY "Delivery can update assigned orders" ON orders FOR UPDATE USING (
  delivery_person_id = auth.uid()::uuid AND get_user_role() = 'delivery'
);
CREATE POLICY "Kitchen can read today orders" ON orders FOR SELECT USING (
  get_user_role() = 'kitchen' AND order_date = CURRENT_DATE
);

-- ORDER ITEMS policies
CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()::uuid)
);
CREATE POLICY "Admin/staff can manage order items" ON order_items FOR ALL USING (get_user_role() IN ('admin', 'staff'));
CREATE POLICY "Kitchen can read order items" ON order_items FOR SELECT USING (get_user_role() = 'kitchen');
CREATE POLICY "Delivery can read order items" ON order_items FOR SELECT USING (get_user_role() = 'delivery');

-- PAYMENTS policies
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can create payments" ON payments FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Admin can manage payments" ON payments FOR ALL USING (get_user_role() = 'admin');

-- COUPONS policies
CREATE POLICY "Anyone can read active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage coupons" ON coupons FOR ALL USING (get_user_role() = 'admin');

-- AUDIT LOGS policies
CREATE POLICY "Anyone can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read audit logs" ON audit_logs FOR SELECT USING (get_user_role() = 'admin');

-- SETTINGS policies
CREATE POLICY "Anyone can read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage settings" ON settings FOR ALL USING (get_user_role() = 'admin');

-- ============================================
-- FUNCTION: Create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

-- Default categories
INSERT INTO categories (name, description, display_order) VALUES
  ('Snacks / Pre-workout Combos', 'Quick energy-boosting snacks and pre-workout meals', 1),
  ('Protein Sandwiches', 'High-protein sandwiches with premium fillings', 2),
  ('Wraps', 'Protein-packed wraps for a quick meal', 3),
  ('Fit Cheesy Pizza Bites', 'Guilt-free pizza bites loaded with protein', 4),
  ('Cheesy Bites', 'Cheese-loaded protein snacks', 5),
  ('Quesadillas', 'Mexican-style protein quesadillas', 6),
  ('Pan Cakes', 'Protein pancakes for a healthy breakfast', 7),
  ('Omelettes', 'Egg-based protein-rich omelettes', 8),
  ('Oat Meals', 'High-protein oatmeal bowls', 9),
  ('Chicken Bites', 'Tender chicken bites with various seasonings', 10),
  ('Organic Paneer Bites', 'Fresh paneer bites for vegetarians', 11),
  ('Whey Protein Shakes', 'Refreshing protein shakes', 12),
  ('Pasta', 'High-protein pasta dishes', 13),
  ('High Protein Salads', 'Fresh salads packed with protein', 14),
  ('Rice Bowls', 'Balanced rice bowls with protein', 15),
  ('Protein Platters', 'Complete protein-loaded platters', 16);

-- Default delivery zones
INSERT INTO delivery_zones (name, description, base_delivery_charge, free_delivery_threshold) VALUES
  ('Kondapur', 'Kondapur and surrounding areas', 30.00, 500.00),
  ('Miyapur', 'Miyapur and surrounding areas', 50.00, 700.00),
  ('Gachibowli', 'Gachibowli and Financial District area', 40.00, 600.00);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('business_name', 'The Protein Makers'),
  ('business_address', 'Kondapur, Raghavendra Nagar Colony, opp Gold Gym, Hyderabad 500084'),
  ('business_phone', '9963701238'),
  ('whatsapp_number', '9963701238'),
  ('operating_hours_start', '08:30'),
  ('operating_hours_end', '23:00'),
  ('default_currency', 'INR'),
  ('pause_cutoff_hours', '24');

-- ============================================
-- STORAGE BUCKET (for meal photos)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view meal photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-photos');

CREATE POLICY "Admin can upload meal photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'meal-photos');

CREATE POLICY "Admin can update meal photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'meal-photos');

CREATE POLICY "Admin can delete meal photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'meal-photos');
