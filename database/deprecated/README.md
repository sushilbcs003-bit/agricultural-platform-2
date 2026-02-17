# Deprecated Schemas

## schema-legacy.sql

**Status:** DEPRECATED - Do not use.

The original `schema.sql` (now preserved as `schema-legacy.sql`) has been deprecated in favor of `schema-3nf.sql`.

**Reason:** schema-3nf.sql provides:
- Normalized 3NF design
- Better indexing and scaling
- Location hierarchy (countries → states → districts → tehsils → villages)
- Unified carts, orders, and payments
- Consistent naming conventions

**Single source of truth:** Use `schema-3nf.sql` only.
