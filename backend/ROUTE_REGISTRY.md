# Route Registry Documentation

## Purpose

This document tracks which route modules are mounted in the application and provides guidelines for route management.

## Current Route Status

### Mounted Routes (backend/src/index.ts)

| Route Module | Path | Status | Notes |
|-------------|------|--------|-------|
| `auth` | `/api/auth` | ✅ Mounted | Authentication and registration |
| `users` | `/api/users` | ✅ Mounted | User management |
| `products` | `/api/products` | ✅ Mounted | Product management |
| `bids` | `/api/bids` | ✅ Mounted | Bidding system |

### Route Files

All route files in `backend/src/routes/`:
- `auth.ts` ✅ Mounted
- `users.ts` ✅ Mounted
- `products.ts` ✅ Mounted
- `bids.ts` ✅ Mounted

## Route Registry Test

A test file `tests/route-registry.test.js` ensures that:
1. All route modules in `src/routes/` are mounted in `src/index.ts`
2. No duplicate route mounts exist
3. Routes follow consistent naming conventions

Run the test:
```bash
npm test -- tests/route-registry.test.js
```

## Adding New Routes

When adding a new route module:

1. **Create the route file** in `backend/src/routes/`
   ```typescript
   // backend/src/routes/newRoute.ts
   import { Router } from 'express';
   const router = Router();
   // ... define routes
   export default router;
   ```

2. **Import in `backend/src/index.ts`**
   ```typescript
   import newRouteRoutes from './routes/newRoute';
   ```

3. **Mount the route**
   ```typescript
   app.use('/api/new-route', newRouteRoutes);
   ```

4. **Run the route registry test**
   ```bash
   npm test -- tests/route-registry.test.js
   ```

## Removing Routes

If a route is no longer needed:

1. Remove the route file from `backend/src/routes/`
2. Remove the import from `backend/src/index.ts`
3. Remove the `app.use()` mount
4. Run tests to ensure everything passes

## Archiving Routes

If a route is planned but not ready:

1. Move the route file to `backend/src/routes/archive/`
2. Add a comment in `backend/src/index.ts` indicating the route is planned
3. Document in this file when it will be enabled

## Route Naming Conventions

- **Route files**: camelCase (e.g., `bidRoutes.ts`)
- **Route paths**: kebab-case (e.g., `/api/bid-history`)
- **Import names**: camelCase with "Routes" suffix (e.g., `bidRoutes`)

## Current Backend Status

**Note:** The application currently runs `backend/index.js` (in-memory backend), not `backend/src/index.ts` (TypeScript/Prisma backend).

The route registry test applies to `backend/src/index.ts` which is the TypeScript backend structure. When migrating to the TypeScript backend, ensure all routes are properly mounted.




