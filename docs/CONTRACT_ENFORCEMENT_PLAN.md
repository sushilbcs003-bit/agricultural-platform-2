# Contract Enforcement Implementation Plan

## Overview

This document outlines the implementation plan for ISSUE-011: Missing centralized validation and shared types between frontend and backend.

## Current Status

✅ **Phase 1 - Foundation (Completed):**
- OpenAPI specification created (`backend/openapi.yaml`)
- Critical auth endpoints documented
- OpenAPI spec served at `/api/openapi.yaml`
- CI workflow created for OpenAPI validation
- Documentation and setup guides created

## Implementation Phases

### Phase 2: Backend Integration (Recommended Next)

**Goal:** Serve Swagger UI and validate requests/responses

**Steps:**
1. Install dependencies:
   ```bash
   cd backend
   npm install --save swagger-ui-express swagger-jsdoc yamljs
   ```

2. Add Swagger UI to backend/index.js:
   ```javascript
   const swaggerUi = require('swagger-ui-express');
   const YAML = require('yamljs');
   const swaggerDocument = YAML.load('./openapi.yaml');
   
   app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
   ```

3. Optional: Add request/response validation middleware using `express-openapi-validator`

**Benefits:**
- Developers can test APIs via Swagger UI
- Visual documentation
- Request/response validation (if middleware added)

### Phase 3: Frontend Type Generation (High Priority)

**Goal:** Generate TypeScript types from OpenAPI spec

**Steps:**
1. Install openapi-typescript:
   ```bash
   cd frontend
   npm install --save-dev openapi-typescript
   ```

2. Generate types:
   ```bash
   npm run generate-types
   ```

3. Update `frontend/src/utils/api.js` to use generated types:
   ```javascript
   import type { paths } from './types/api';
   
   export const checkPhoneExists = async (phone: string): Promise<paths['/api/auth/check-phone']['post']['responses']['200']['content']['application/json']> => {
     // ...
   };
   ```

4. Convert frontend to TypeScript (optional but recommended for full type safety)

**Benefits:**
- Compile-time type checking
- Auto-completion in IDE
- Prevents API contract drift

### Phase 4: Contract Testing (Medium Priority)

**Goal:** Automated tests to ensure backend responses match OpenAPI schema

**Steps:**
1. Install test dependencies:
   ```bash
   cd backend
   npm install --save-dev jest supertest ajv ajv-formats
   ```

2. Create `backend/tests/contract.test.js`:
   ```javascript
   const Ajv = require('ajv');
   const addFormats = require('ajv-formats');
   const request = require('supertest');
   const app = require('../index');
   const openapiSchema = require('../openapi.yaml'); // Use js-yaml to load
   
   // Test each endpoint response matches schema
   ```

3. Add to package.json:
   ```json
   "scripts": {
     "test:contract": "jest tests/contract.test.js"
   }
   ```

**Benefits:**
- Catches breaking changes in API responses
- Ensures OpenAPI spec stays in sync with implementation

### Phase 5: CI Integration (High Priority)

**Goal:** Fail CI if contracts don't match

**Current Status:** ✅ Basic OpenAPI validation in CI

**Next Steps:**
1. Add contract tests to CI workflow
2. Add type generation check (ensure frontend types are up-to-date)
3. Add check to ensure OpenAPI spec is updated when endpoints change

**Enhanced CI Workflow:**
```yaml
jobs:
  validate-openapi:
    # ✅ Already implemented
  contract-tests:
    # Run contract tests
  type-generation:
    # Verify frontend types are generated
    # Fail if types are out of date
```

### Phase 6: Request/Response Validation (Optional)

**Goal:** Runtime validation using OpenAPI schema

**Steps:**
1. Install `express-openapi-validator`:
   ```bash
   cd backend
   npm install express-openapi-validator
   ```

2. Add validation middleware:
   ```javascript
   const OpenApiValidator = require('express-openapi-validator');
   
   app.use(
     OpenApiValidator.middleware({
       apiSpec: './openapi.yaml',
       validateRequests: true,
       validateResponses: true,
     })
   );
   ```

**Benefits:**
- Runtime validation of requests/responses
- Automatic 400 errors for invalid requests
- Ensures responses match schema

## Quick Start

1. **View API documentation:**
   ```bash
   # After Phase 2 implementation
   curl http://localhost:3001/api/docs
   ```

2. **Generate frontend types:**
   ```bash
   cd frontend
   npm run generate-types
   ```

3. **Validate OpenAPI spec:**
   ```bash
   cd backend
   npm run validate-openapi
   # Or use swagger-cli validate openapi.yaml
   ```

## Acceptance Criteria Status

- [x] OpenAPI spec exists
- [ ] Frontend API calls are typed (Phase 3)
- [ ] Contract tests exist (Phase 4)
- [x] CI validates OpenAPI spec (Phase 5)
- [ ] CI fails if contract changes without updates (Phase 5 - enhanced)

## Notes

- The OpenAPI spec is the single source of truth
- Always update the spec before changing endpoints
- Run type generation after spec changes
- Contract tests catch breaking changes early

