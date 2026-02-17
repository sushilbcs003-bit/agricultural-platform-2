# API Types

This directory contains TypeScript types generated from the OpenAPI specification.

## Generating Types

Run from the frontend directory:

```bash
npm run generate-types
```

This will generate `api.ts` from `backend/openapi.yaml`.

## Usage

Import types in your API functions:

```typescript
import type { paths } from './types/api';

// Use types from the generated schema
type CheckPhoneRequest = paths['/api/auth/check-phone']['post']['requestBody']['content']['application/json'];
type CheckPhoneResponse = paths['/api/auth/check-phone']['post']['responses']['200']['content']['application/json'];
```

## Setup

1. Install openapi-typescript:
   ```bash
   npm install --save-dev openapi-typescript
   ```

2. Add script to package.json:
   ```json
   "generate-types": "openapi-typescript ../backend/openapi.yaml -o src/types/api.ts"
   ```

3. Generate types:
   ```bash
   npm run generate-types
   ```




