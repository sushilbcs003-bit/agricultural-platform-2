-- Payment Deals: Dual consent flow - no charge until both parties agree
-- Phase B schema (see docs/PAYMENT_ARCHITECTURE.md)

-- Deal lifecycle and consent tracking
CREATE TABLE IF NOT EXISTS payment_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farmer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  status VARCHAR(40) NOT NULL DEFAULT 'DEAL_CREATED',
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  
  buyer_consent_at TIMESTAMPTZ,
  farmer_consent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_deals_bid ON payment_deals(bid_id);
CREATE INDEX IF NOT EXISTS idx_payment_deals_buyer ON payment_deals(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_deals_farmer ON payment_deals(farmer_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_deals_status ON payment_deals(status);

-- Payment intents: Gateway tokens only (no sensitive data)
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_deal_id UUID NOT NULL REFERENCES payment_deals(id) ON DELETE CASCADE,
  
  gateway_payment_id VARCHAR(120),
  gateway_order_id VARCHAR(120),
  payment_method VARCHAR(40),
  intent_status VARCHAR(30),
  intent_reference_hash VARCHAR(64) NOT NULL UNIQUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_deal ON payment_intents(payment_deal_id);

-- Audit for consent and status changes
CREATE TABLE IF NOT EXISTS payment_deal_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_deal_id UUID NOT NULL REFERENCES payment_deals(id) ON DELETE CASCADE,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  previous_status VARCHAR(40),
  new_status VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_deal_audit_deal ON payment_deal_audit(payment_deal_id);
