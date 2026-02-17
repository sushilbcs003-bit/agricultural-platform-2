# OpenAPI Contract Setup

This document outlines the setup for OpenAPI contract enforcement between frontend and backend.

## Current Status

✅ **Completed:**
- OpenAPI specification created (`backend/openapi.yaml`)
- Critical auth endpoints documented

## Next Steps

### 1. Backend Setup (In Progress)

**Install dependencies:**
```bash
cd backend
npm install --save swagger-ui-express swagger-jsdoc
npm install --save-dev @apidevtools/swagger-cli
```

**Add to backend/index.js:**
- Serve OpenAPI spec at `/api/docs`
- Validate requests/responses against schema (optional but recommended)

### 2. Frontend Type Generation

**Install dependencies:**
```bash
cd frontend
npm install --save-dev openapi-typescript
```

**Add script to frontend/package.json:**
```json
"scripts": {
  "generate-types": "openapi-typescript ../../backend/openapi.yaml -o src/types/api.ts"
}
```

**Generate types:**
```bash
npm run generate-types
```

**Update frontend/src/utils/api.js:**
- Import and use generated types
- Type all API functions with generated interfaces

### 3. Contract Validation Tests

**Create backend/tests/contract.test.js:**
- Test that responses match OpenAPI schema
- Use `ajv` or `swagger-parser` for validation

**Install test dependencies:**
```bash
cd backend
npm install --save-dev jest supertest ajv ajv-formats
```

### 4. CI Integration

**Create .github/workflows/contract-check.yml:**
- Validate OpenAPI spec syntax
- Run contract tests
- Fail build if contracts don't match

## Usage

1. **Update API contract:**
   - Edit `backend/openapi.yaml`
   - Run contract tests: `npm test`
   - Generate frontend types: `cd frontend && npm run generate-types`

2. **View API docs:**
   - Start backend server
   - Visit `http://localhost:3001/api/docs`

3. **Type safety:**
   - Frontend code will have TypeScript types from OpenAPI spec
   - Compile-time errors if API calls don't match contract

## Future Enhancements

- Request/response validation middleware using OpenAPI schema
- Auto-generate API client code from spec
- Contract testing in CI/CD pipeline
- API versioning strategy in OpenAPI

