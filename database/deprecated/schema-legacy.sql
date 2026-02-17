-- Agricultural Platform Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('FARMER', 'BUYER', 'PROVIDER', 'ADMIN');
CREATE TYPE provider_type AS ENUM ('TEST', 'TRANSPORT', 'MACHINERY');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'UNDER_BID', 'SOLD', 'CANCELLED');
CREATE TYPE bid_status AS ENUM ('SUBMITTED', 'SELECTED', 'ACCEPTED', 'REJECTED', 'COUNTERED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE test_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE land_area_unit AS ENUM ('BIGHA', 'HECTARE', 'ACRE');
CREATE TYPE irrigation_source AS ENUM ('RAINWATER', 'TUBE_WELL', 'CANAL', 'RIVER', 'POND', 'OTHER');
CREATE TYPE ownership_type AS ENUM ('OWNED', 'LEASED', 'SHARED');

-- Core Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    email VARCHAR(255) UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    aadhaar_encrypted TEXT, -- Encrypted Aadhaar number
    gst VARCHAR(15) UNIQUE, -- Only for buyers, immutable
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farmer-specific profile
CREATE TABLE farmer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    village VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    about TEXT,
    main_road_connectivity BOOLEAN DEFAULT FALSE,
    land_area_value DECIMAL(10,2),
    land_area_unit land_area_unit,
    irrigation_source irrigation_source,
    ownership_type ownership_type,
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buyer-specific profile
CREATE TABLE buyer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    business_address TEXT,
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    contact_person VARCHAR(100),
    business_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Provider profiles
CREATE TABLE provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_types provider_type[] NOT NULL,
    organization_name VARCHAR(200) NOT NULL,
    business_address TEXT,
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gst_number VARCHAR(15),
    license_documents JSONB, -- Array of document URLs
    coverage_areas JSONB, -- Array of districts/areas covered
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product categories master
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products listed by farmers
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    name_en VARCHAR(200) NOT NULL,
    name_hi VARCHAR(200),
    description_en TEXT,
    description_hi TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    expected_price DECIMAL(10,2) NOT NULL,
    harvest_date DATE,
    expiry_date DATE,
    images JSONB, -- Array of image URLs
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    status product_status DEFAULT 'ACTIVE',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buyer bids on products
CREATE TABLE buyer_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    offered_price DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    message TEXT,
    status bid_status DEFAULT 'SUBMITTED',
    negotiation_round INTEGER DEFAULT 1,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buyer's selected items (cart)
CREATE TABLE buyer_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bid_id UUID REFERENCES buyer_bids(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    farmer_id UUID REFERENCES users(id),
    quantity DECIMAL(10,2) NOT NULL,
    agreed_price DECIMAL(10,2),
    is_checked_out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking'
    status payment_status DEFAULT 'PENDING',
    gateway_name VARCHAR(50), -- 'razorpay', 'stripe', etc.
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test requests and scheduling
CREATE TABLE test_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    test_provider_id UUID REFERENCES provider_profiles(id),
    scheduled_at TIMESTAMP,
    status test_status DEFAULT 'SCHEDULED',
    test_location TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI-powered test results
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_request_id UUID REFERENCES test_requests(id) ON DELETE CASCADE,
    quality_score DECIMAL(5,2), -- 0-100
    grade VARCHAR(10), -- A, B, C, D
    defects JSONB, -- Array of detected defects
    recommendations JSONB, -- AI recommendations
    price_adjustment_percentage DECIMAL(5,2), -- +/- percentage
    confidence_score DECIMAL(5,2),
    ai_model_version VARCHAR(50),
    raw_ai_output JSONB,
    test_images JSONB, -- Array of image URLs
    lab_results JSONB, -- Manual lab test results if any
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport and machinery listings
CREATE TABLE transport_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    capacity_kg DECIMAL(10,2),
    price_per_km DECIMAL(8,2),
    price_per_trip DECIMAL(10,2),
    availability_start DATE,
    availability_end DATE,
    coverage_areas JSONB,
    vehicle_registration VARCHAR(20),
    images JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE machinery_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
    machine_type VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    price_per_day DECIMAL(10,2),
    price_per_hour DECIMAL(8,2),
    availability_start DATE,
    availability_end DATE,
    coverage_areas JSONB,
    specifications JSONB,
    images JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings for transport and machinery
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_type provider_type NOT NULL,
    provider_id UUID REFERENCES provider_profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE, -- farmer or buyer
    listing_id UUID, -- transport_listings.id or machinery_listings.id
    product_ids JSONB, -- Array of product IDs being transported
    start_date DATE NOT NULL,
    end_date DATE,
    pickup_location TEXT,
    delivery_location TEXT,
    total_distance_km DECIMAL(8,2),
    duration_hours INTEGER,
    total_price DECIMAL(10,2) NOT NULL,
    advance_payment DECIMAL(10,2),
    status booking_status DEFAULT 'PENDING',
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Final orders combining all services
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    bid_id UUID REFERENCES buyer_bids(id),
    payment_id UUID REFERENCES payments(id),
    test_request_id UUID REFERENCES test_requests(id),
    transport_booking_id UUID REFERENCES bookings(id),
    machinery_booking_id UUID REFERENCES bookings(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status order_status DEFAULT 'PENDING',
    estimated_delivery DATE,
    actual_delivery TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'bid', 'payment', 'order', 'test', 'booking'
    reference_id UUID, -- Related entity ID
    is_read BOOLEAN DEFAULT FALSE,
    sent_via JSONB, -- ['email', 'sms', 'push']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP management
CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'registration', 'login', 'password_reset'
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback and ratings
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master data: States and Districts
CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100),
    code VARCHAR(3) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID REFERENCES states(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100),
    code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_gst ON users(gst);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_farmer_id ON products(farmer_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_buyer_bids_buyer_id ON buyer_bids(buyer_id);
CREATE INDEX idx_buyer_bids_product_id ON buyer_bids(product_id);
CREATE INDEX idx_buyer_bids_status ON buyer_bids(status);
CREATE INDEX idx_payments_buyer_id ON payments(buyer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_farmer_profiles_updated_at BEFORE UPDATE ON farmer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_bids_updated_at BEFORE UPDATE ON buyer_bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_requests_updated_at BEFORE UPDATE ON test_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transport_listings_updated_at BEFORE UPDATE ON transport_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machinery_listings_updated_at BEFORE UPDATE ON machinery_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
