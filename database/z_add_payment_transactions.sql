-- Payment transactions: reference-only storage (no sensitive payment data)
-- Stores hashed reference + metadata. Never stores card/account/UPI details.

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_hash VARCHAR(64) NOT NULL UNIQUE,
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  provider VARCHAR(40) NOT NULL DEFAULT 'SIMULATED',
  payer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payer_role VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_bid ON payment_transactions(bid_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payer ON payment_transactions(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_ref_hash ON payment_transactions(reference_hash);
