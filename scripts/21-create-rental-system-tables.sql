-- Rental System Tables Migration
-- Creates tables for: bookings, reviews, damage reports, extensions

-- ============================================
-- 1. RENTAL BOOKINGS TABLE
-- Tracks all rental periods and their status
-- ============================================
CREATE TABLE IF NOT EXISTS rental_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES marketplace_offers(id) ON DELETE SET NULL,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    renter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Booking dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_return_date DATE,
    
    -- Pricing
    daily_rate_cents INTEGER NOT NULL,
    total_amount_cents INTEGER NOT NULL,
    deposit_amount_cents INTEGER DEFAULT 0,
    deposit_status VARCHAR(50) DEFAULT 'held', -- held, returned, partially_returned, forfeited
    deposit_returned_cents INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, active, returned, overdue, cancelled, disputed
    
    -- Pickup/Delivery info
    pickup_method VARCHAR(50), -- pickup, shipping
    pickup_address TEXT,
    tracking_number VARCHAR(255),
    
    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for calendar queries (finding bookings by date range)
CREATE INDEX IF NOT EXISTS idx_rental_bookings_dates ON rental_bookings(offer_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_renter ON rental_bookings(renter_id, status);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_owner ON rental_bookings(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_status ON rental_bookings(status, end_date);

-- ============================================
-- 2. RENTAL REVIEWS TABLE
-- Mutual reviews after rental completion
-- ============================================
CREATE TABLE IF NOT EXISTS rental_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Review type
    review_type VARCHAR(20) NOT NULL, -- 'owner_reviews_renter' or 'renter_reviews_owner'
    
    -- Ratings (1-5 stars)
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    
    -- Game condition (only for owner reviewing renter)
    game_condition_rating INTEGER CHECK (game_condition_rating >= 1 AND game_condition_rating <= 5),
    game_condition_notes TEXT,
    
    -- Review text
    review_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one review per person per booking per type
    UNIQUE(booking_id, reviewer_id, review_type)
);

CREATE INDEX IF NOT EXISTS idx_rental_reviews_booking ON rental_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_rental_reviews_reviewee ON rental_reviews(reviewee_id);

-- ============================================
-- 3. RENTAL DAMAGE REPORTS TABLE
-- For reporting and handling damages
-- ============================================
CREATE TABLE IF NOT EXISTS rental_damage_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Damage details
    damage_description TEXT NOT NULL,
    damage_photos JSONB DEFAULT '[]'::jsonb, -- Array of photo URLs
    estimated_cost_cents INTEGER,
    
    -- Resolution
    status VARCHAR(50) DEFAULT 'reported', -- reported, under_review, agreed, disputed, resolved
    resolution_type VARCHAR(50), -- no_action, partial_deposit, full_deposit, additional_payment
    resolved_amount_cents INTEGER,
    resolution_notes TEXT,
    
    -- If disputed, track dispute details
    dispute_reason TEXT,
    dispute_evidence JSONB DEFAULT '[]'::jsonb,
    
    -- Admin/support intervention
    admin_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_damage_reports_booking ON rental_damage_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_rental_damage_reports_status ON rental_damage_reports(status);

-- ============================================
-- 4. RENTAL EXTENSIONS TABLE
-- For rental period extension requests
-- ============================================
CREATE TABLE IF NOT EXISTS rental_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Extension details
    original_end_date DATE NOT NULL,
    requested_end_date DATE NOT NULL,
    extension_days INTEGER NOT NULL,
    
    -- Pricing
    additional_amount_cents INTEGER NOT NULL,
    daily_rate_cents INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    rejection_reason TEXT,
    
    -- Payment (if approved)
    payment_completed BOOLEAN DEFAULT FALSE,
    stripe_payment_intent_id VARCHAR(255),
    
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_extensions_booking ON rental_extensions(booking_id);
CREATE INDEX IF NOT EXISTS idx_rental_extensions_status ON rental_extensions(status);

-- ============================================
-- 5. RENTAL REMINDERS SENT TABLE
-- Track which reminders have been sent
-- ============================================
CREATE TABLE IF NOT EXISTS rental_reminders_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'three_days_before', 'one_day_before', 'due_today', 'overdue'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(booking_id, user_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_rental_reminders_booking ON rental_reminders_sent(booking_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_reminders_sent ENABLE ROW LEVEL SECURITY;

-- rental_bookings policies
CREATE POLICY "Users can view their own bookings" ON rental_bookings
    FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create bookings" ON rental_bookings
    FOR INSERT WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Booking participants can update" ON rental_bookings
    FOR UPDATE USING (auth.uid() = renter_id OR auth.uid() = owner_id);

-- rental_reviews policies
CREATE POLICY "Users can view reviews" ON rental_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON rental_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON rental_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- rental_damage_reports policies
CREATE POLICY "Booking participants can view damage reports" ON rental_damage_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rental_bookings 
            WHERE rental_bookings.id = rental_damage_reports.booking_id 
            AND (rental_bookings.renter_id = auth.uid() OR rental_bookings.owner_id = auth.uid())
        )
    );

CREATE POLICY "Booking participants can create damage reports" ON rental_damage_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM rental_bookings 
            WHERE rental_bookings.id = booking_id 
            AND (rental_bookings.renter_id = auth.uid() OR rental_bookings.owner_id = auth.uid())
        )
    );

CREATE POLICY "Reporter can update damage reports" ON rental_damage_reports
    FOR UPDATE USING (auth.uid() = reporter_id);

-- rental_extensions policies
CREATE POLICY "Booking participants can view extensions" ON rental_extensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rental_bookings 
            WHERE rental_bookings.id = rental_extensions.booking_id 
            AND (rental_bookings.renter_id = auth.uid() OR rental_bookings.owner_id = auth.uid())
        )
    );

CREATE POLICY "Renters can request extensions" ON rental_extensions
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Booking participants can update extensions" ON rental_extensions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM rental_bookings 
            WHERE rental_bookings.id = rental_extensions.booking_id 
            AND (rental_bookings.renter_id = auth.uid() OR rental_bookings.owner_id = auth.uid())
        )
    );

-- rental_reminders_sent policies
CREATE POLICY "Users can view their own reminders" ON rental_reminders_sent
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders" ON rental_reminders_sent
    FOR INSERT WITH CHECK (true);

-- ============================================
-- Add notification types for rental system
-- ============================================
-- Note: These will be handled in notification-helpers.ts
-- Types: rental_reminder, rental_extension_request, rental_extension_response, 
--        rental_damage_report, rental_review_request, rental_overdue
