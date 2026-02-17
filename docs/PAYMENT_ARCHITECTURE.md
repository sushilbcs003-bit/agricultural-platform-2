# Payment Architecture - Dual Consent & Secure Flow

## Design Principles

1. **Dual consent** – No money moves until both buyer and seller (farmer) explicitly consent
2. **Intent capture** – Payment details are captured to signal commitment, without charging
3. **Tokenization** – Sensitive data never touches our servers; use payment gateway tokens
4. **Audit trail** – Every state change is logged for dispute resolution

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DUAL CONSENT PAYMENT FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Phase 1: DEAL AGREEMENT
───────────────────────
  Farmer accepts bid  ──►  Deal created (status: AWAITING_PAYMENT_INTENT)
                                │
                                ▼
Phase 2: PAYMENT INTENT (Buyer commits)
──────────────────────────────────────
  Buyer enters payment method  ──►  Gateway tokenizes (no charge)
  Buyer confirms intent       ──►  Payment intent stored (token only)
                                │
                                ▼
  Deal status: PAYMENT_INTENT_CAPTURED
  Farmer sees: "Buyer has committed payment details"
                                │
                                ▼
Phase 3: FARMER CONSENT
───────────────────────
  Farmer reviews deal & confirms  ──►  Deal status: BOTH_CONSENTED
                                │
                                ▼
Phase 4: PAYMENT EXECUTION (Only after both consent)
────────────────────────────────────────────────────
  System triggers charge using stored token
  Gateway executes payment
  Deal status: PAYMENT_COMPLETED
```

---

## State Machine: Payment Deal

| State | Description | Buyer Action | Farmer Action |
|-------|-------------|--------------|---------------|
| `DEAL_CREATED` | Farmer accepted bid | — | — |
| `AWAITING_PAYMENT_INTENT` | Waiting for buyer to add payment | Enter payment method, confirm | — |
| `PAYMENT_INTENT_CAPTURED` | Buyer committed (token stored) | — | Review & give consent |
| `BOTH_CONSENTED` | Both parties agreed | — | — |
| `PAYMENT_INITIATED` | Charge in progress | — | — |
| `PAYMENT_COMPLETED` | Money transferred | — | — |
| `PAYMENT_FAILED` | Charge failed | Retry / change method | — |
| `DEAL_CANCELLED` | Either party withdrew | Cancel | Cancel |

---

## Indian Payment Methods (Supported via Razorpay/CCAvenue/PayU)

| Method | Description | Tokenization | Hold/Intent |
|--------|-------------|--------------|-------------|
| **UPI** | Google Pay, PhonePe, Paytm, BHIM, etc. | ✅ | Pre-authorization (mandate) |
| **Cards** | Debit, Credit, RuPay | ✅ | Authorization hold |
| **Net Banking** | All major banks | Via redirect | N/A (instant) |
| **Wallets** | Paytm, Mobikwik, Freecharge, etc. | ✅ | Balance check |
| **EMI** | Card/No-cost EMI | ✅ | Hold |
| **BNPL** | Simpl, LazyPay, etc. | ✅ | Credit check |

**Preferred gateway**: Razorpay (UPI, cards, net banking, wallets, EMI) or PayU/CCAvenue for similar coverage.

---

## Data Model

### 1. `payment_deals` (Deal lifecycle)

```sql
CREATE TABLE payment_deals (
  id UUID PRIMARY KEY,
  bid_id UUID NOT NULL REFERENCES bids(id),
  buyer_user_id UUID NOT NULL,
  farmer_user_id UUID NOT NULL,
  
  -- State
  status VARCHAR(40) NOT NULL DEFAULT 'DEAL_CREATED',
  -- DEAL_CREATED | AWAITING_PAYMENT_INTENT | PAYMENT_INTENT_CAPTURED 
  -- | BOTH_CONSENTED | PAYMENT_INITIATED | PAYMENT_COMPLETED | PAYMENT_FAILED | DEAL_CANCELLED
  
  -- Amount (stored for audit; source of truth is bid)
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Consent timestamps
  buyer_consent_at TIMESTAMPTZ,
  farmer_consent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. `payment_intents` (Tokens only – no card/account data)

```sql
CREATE TABLE payment_intents (
  id UUID PRIMARY KEY,
  payment_deal_id UUID NOT NULL REFERENCES payment_deals(id),
  
  -- Gateway reference (opaque token – NOT raw card/UPI)
  gateway_payment_id VARCHAR(120),
  gateway_order_id VARCHAR(120),
  payment_method VARCHAR(40),  -- UPI | CARD | NETBANKING | WALLET | EMI
  
  -- Status from gateway
  intent_status VARCHAR(30),   -- CREATED | AUTHORIZED | CAPTURED | FAILED
  
  -- Idempotency
  intent_reference_hash VARCHAR(64) UNIQUE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. `payment_transactions` (Existing – execution record)

- Stores only `reference_hash`, `amount`, `status`, `provider`, `payer_user_id`, etc.
- Populated when charge is actually executed (after dual consent).

---

## Security Controls

### 1. Tokenization (PCI-DSS compliant)

- Buyer enters payment details only on gateway-hosted page or SDK.
- Our app receives only `payment_id` / `order_id` (token).
- No card number, CVV, or UPI PIN ever stored or logged.

### 2. Dual consent enforcement

- Charge API checks: `payment_deals.status = 'BOTH_CONSENTED'`.
- Reject charge if either `buyer_consent_at` or `farmer_consent_at` is NULL.

### 3. Intent expiry

- Payment intent expires after 24–48 hours if farmer does not consent.
- Gateway pre-auth/hold auto-releases on expiry.

### 4. Idempotency

- `intent_reference_hash` = SHA256(deal_id + attempt_id) prevents duplicate charges.
- Gateway idempotency keys used for capture calls.

### 5. Audit

- All status changes logged with `user_id`, `timestamp`, `previous_status`, `new_status`.
- Separate `payment_deal_audit` table for compliance and disputes.

---

## API Design

### Phase 1: Create deal (when farmer accepts bid)

```
POST /api/payment-deals
Body: { bidId }
→ Creates payment_deal, status = AWAITING_PAYMENT_INTENT
```

### Phase 2: Create payment intent (buyer)

```
POST /api/payment-deals/:dealId/create-intent
Body: { amount, currency, method: 'upi'|'card'|'netbanking'|'wallet' }
→ Returns { gatewayOrderId, gatewayKey } for client-side SDK
→ Buyer completes payment on gateway UI
→ Webhook receives AUTHORIZED/CREATED
→ status = PAYMENT_INTENT_CAPTURED, buyer_consent_at = now()
```

### Phase 3: Farmer consent

```
POST /api/payment-deals/:dealId/farmer-consent
→ status = BOTH_CONSENTED, farmer_consent_at = now()
→ Triggers async payment capture (or queues job)
```

### Phase 4: Capture (system, after both consent)

```
Internal: POST to gateway capture API
→ status = PAYMENT_INITIATED
→ On success: PAYMENT_COMPLETED, insert payment_transaction
→ On failure: PAYMENT_FAILED
```

---

## Indian Payment Methods – Implementation Notes

| Method | Gateway API | Our Handling |
|--------|-------------|--------------|
| **UPI** | `order.create` + customer completes on app | Store `razorpay_payment_id`; capture after consent |
| **Cards** | `order.create` with `method: 'card'` | Authorization hold; capture within 5–7 days |
| **Net Banking** | `order.create` with `method: 'netbanking'` | Redirect; webhook on success; capture after consent |
| **Wallets** | `order.create` with `method: 'wallet'` | Instant; treat as intent + capture in same flow |
| **EMI** | `order.create` with `method: 'emi'` | Same as cards with EMI metadata |
| **UPI AutoPay** | Mandate creation | Recurring; use for subscription-style flows |

**Razorpay methods**: `upi`, `card`, `netbanking`, `wallet`, `emi`, `upi_customer`.

---

## Sequence Diagram (Simplified)

```
Buyer          Platform         Gateway         Farmer
  |                |                |              |
  | Accept bid     |                |              |
  |<───────────────|                |              |
  |                | Create deal    |              |
  |                | AWAITING_INTENT|              |
  |                |                |              |
  | Add payment    |                |              |
  |───────────────>| Create order   |              |
  |                |───────────────>|              |
  |                | Return order_id|              |
  |<───────────────|                |              |
  | Pay on gateway |                |              |
  |────────────────────────────────>|              |
  |                | Webhook: auth  |              |
  |                |<───────────────|              |
  |                | INTENT_CAPTURED|              |
  |                | buyer_consent  |              |
  |                |─────────────────────────────>| Notify
  |                |                |              |
  |                |                |   Consent    |
  |                |<─────────────────────────────|
  |                | BOTH_CONSENTED |              |
  |                | Capture        |              |
  |                |───────────────>|              |
  |                | PAYMENT_DONE   |              |
  |<───────────────|                |<─────────────| Notify
```

---

## Implementation Phases

### Phase A (Current)
- [x] Reference-only `payment_transactions`
- [x] Simulated payment with hashed reference

### Phase B (Dual consent + intent)
- [ ] `payment_deals` table and state machine
- [ ] Deal creation on bid acceptance
- [ ] UI for buyer to "commit payment" (simulated intent)
- [ ] UI for farmer to "confirm deal"
- [ ] Enforce both consent before any charge

### Phase C (Gateway integration)
- [ ] Razorpay (or PayU) integration
- [ ] Order creation, tokenization, webhooks
- [ ] UPI, Cards, Net Banking, Wallets
- [ ] Capture only when `BOTH_CONSENTED`

### Phase D (Hardening)
- [ ] Intent expiry and auto-release
- [ ] Audit logs and dispute handling
- [ ] Refunds and partial refunds

---

---

## Appendix: Indian Payment Methods Checklist

| # | Method | Razorpay Code | Notes |
|---|--------|---------------|-------|
| 1 | UPI | `upi` | Google Pay, PhonePe, Paytm, BHIM, etc. |
| 2 | Debit Card | `card` | Visa, Mastercard, RuPay |
| 3 | Credit Card | `card` | Same as debit |
| 4 | RuPay | `card` | Domestic card network |
| 5 | Net Banking | `netbanking` | All major banks |
| 6 | Paytm Wallet | `wallet` (paytm) | |
| 7 | Mobikwik | `wallet` (mobikwik) | |
| 8 | Freecharge | `wallet` (freecharge) | |
| 9 | EMI | `emi` | Card EMI, No-cost EMI |
| 10 | UPI AutoPay | Mandate API | Recurring payments |
| 11 | BNPL | Partner integration | Simpl, LazyPay |
| 12 | Cardless EMI | `cardless_emi` | ZestMoney, etc. |

**Implementation**: Configure in Razorpay Dashboard → Settings → Payment Methods. Enable required methods. Use `method` in order creation.

---

## References

- [Razorpay Payment Links](https://razorpay.com/docs/payments/payment-links/)
- [Razorpay Payment Methods](https://razorpay.com/docs/payments/payment-methods/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [PCI-DSS Tokenization](https://www.pcisecuritystandards.org/)
