# Payment Security - Reference-Only Storage

## Approach

We **never store sensitive payment data** (card numbers, CVV, full bank account, UPI IDs used for payment) in our database.

### What We Store (`payment_transactions` table)

| Column        | Purpose                                   |
|--------------|--------------------------------------------|
| reference_hash | SHA256 hash of payment reference (opaque) |
| bid_id       | Link to bid (if applicable)                |
| order_id     | Link to order (if applicable)              |
| amount       | Amount in rupees                           |
| currency     | INR                                        |
| status       | SUCCESS / PENDING / FAILED                 |
| provider     | SIMULATED / RAZORPAY / etc                 |
| payer_user_id| Who paid                                   |
| payer_role   | BUYER / FARMER / SUPPLIER                  |
| created_at   | Timestamp                                  |

### What We Do NOT Store

- Card numbers, expiry, CVV
- Bank account numbers (except encrypted in payment_profiles for payouts)
- Full UPI IDs used for payment
- Any data that could be used to initiate a payment

### Flow

1. **Simulated payment**: Frontend generates opaque `clientRef`, backend hashes it with SHA256 and stores `reference_hash`. The raw reference is never persisted.
2. **Real payment** (future): Payment gateway (Razorpay/Stripe) handles sensitive data. We receive only `gateway_txn_id` and store that as reference. Card data never touches our servers.

### Migrations

- `database/z_add_payment_transactions.sql` - Creates table (runs on fresh DB init)
- `database/migrations/005_add_payment_transactions.sql` - For manual apply

To apply on existing DB:
```bash
docker exec -i agricultural_postgres psql -U postgres -d agricultural_platform < database/z_add_payment_transactions.sql
```
