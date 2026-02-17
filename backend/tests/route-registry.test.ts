/**
 * Route Registry Test
 * 
 * This test ensures that all route modules are properly mounted in the application.
 * If a route file exists in src/routes/, it must be mounted in src/index.ts.
 * 
 * Purpose: Prevent "dead code" routes that exist but are unreachable at runtime.
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Route Registry', () => {
  const routesDir = path.join(__dirname, '../src/routes');
  const indexFile = path.join(__dirname, '../src/index.ts');

  it('should mount all route modules that exist in src/routes/', () => {
    // Get all route files
    const routeFiles = fs.readdirSync(routesDir)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts')
      .map(file => file.replace('.ts', ''));

    // Read the index.ts file
    const indexContent = fs.readFileSync(indexFile, 'utf-8');

    // Check that each route file has a corresponding import and mount
    const unmountedRoutes: string[] = [];

    for (const routeName of routeFiles) {
      const routeModule = routeName;
      const importPattern = new RegExp(`import.*${routeModule}.*from.*routes/${routeModule}`, 'i');
      const mountPattern = new RegExp(`app\\.use\\(['"]/api/${routeModule}`, 'i');

      const hasImport = importPattern.test(indexContent);
      const hasMount = mountPattern.test(indexContent);

      if (!hasImport || !hasMount) {
        unmountedRoutes.push(routeModule);
      }
    }

    if (unmountedRoutes.length > 0) {
      const errorMessage = `
The following route modules exist but are not mounted in src/index.ts:
${unmountedRoutes.map(r => `  - ${r}`).join('\n')}

Either:
1. Mount the routes: app.use('/api/${unmountedRoutes[0]}', ${unmountedRoutes[0]}Routes);
2. Remove the unused route files if they're not ready
3. Archive them if they're planned for future use
      `.trim();

      expect(unmountedRoutes).toEqual([]);
      throw new Error(errorMessage);
    }
  });

  it('should not have duplicate route mounts', () => {
    const indexContent = fs.readFileSync(indexFile, 'utf-8');
    
    // Extract all app.use('/api/... patterns
    const mountMatches = indexContent.matchAll(/app\.use\(['"]\/api\/(\w+)/g);
    const mountedRoutes = Array.from(mountMatches).map(match => match[1]);

    const duplicates = mountedRoutes.filter((route, index) => 
      mountedRoutes.indexOf(route) !== index
    );

    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate route mounts found: ${duplicates.join(', ')}\n` +
        'Each route should only be mounted once.'
      );
    }
  });

  it('should have consistent route naming (kebab-case for paths, camelCase for imports)', () => {
    const indexContent = fs.readFileSync(indexFile, 'utf-8');
    
    // Check that route paths use kebab-case or consistent naming
    const mountMatches = indexContent.matchAll(/app\.use\(['"]\/api\/([\w-]+)/g);
    const routePaths = Array.from(mountMatches).map(match => match[1]);

    // All routes should use consistent naming (no mixed case issues)
    // This is a basic check - can be enhanced with stricter rules
    const invalidPaths = routePaths.filter(path => 
      path.includes('_') || /[A-Z]/.test(path)
    );

    if (invalidPaths.length > 0) {
      console.warn(
        'Route paths should use kebab-case or lowercase:',
        invalidPaths.join(', ')
      );
    }
  });
});




