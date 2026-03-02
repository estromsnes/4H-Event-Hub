# Testing Guide

Dette prosjektet har et komplett test-rammeverk med unit tests, integrasjonstester og ende-til-ende tester.

## Installasjon av test-dependencies

Først, installer alle avhengigheter:

```bash
npm install
```

For E2E-tester, installer Playwright browsers:

```bash
npx playwright install
```

## Kjøre tester

### Alle tester (unit + integration)
```bash
npm test
```

### Unit tests
```bash
npm run test:unit
```

### Integration tests
```bash
npm run test:integration
```

### E2E tests (Playwright)
```bash
npm run test:e2e
```

### E2E tests med UI (nyttig for debugging)
```bash
npm run test:e2e:ui
```

### Alle tester inkludert E2E
```bash
npm run test:all
```

### Watch mode (kjører tester automatisk ved endringer)
```bash
npm run test:watch
```

### Test coverage rapport
```bash
npm run test:coverage
```

## Test-struktur

```
tests/
├── setup.js                 # Test setup og globale utilities
├── unit/                    # Unit tests
│   └── participant.test.js  # Tester for participant logikk
├── integration/             # Integration tests
│   └── api.test.js         # API endpoint tests
└── e2e/                     # End-to-end tests (Playwright)
    ├── welcome.spec.js     # Welcome page tests
    └── admin.spec.js       # Admin panel tests
```

## Skrive nye tester

### Unit tests

Unit tests tester individuelle funksjoner og logikk isolert:

```javascript
describe('My Function', () => {
  test('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Integration tests

Integration tests tester API endpoints:

```javascript
const request = require('supertest');

test('should get participants', async () => {
  const response = await request(app).get('/api/participants');
  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
});
```

### E2E tests

E2E tests tester hele brukerflyt i nettleseren:

```javascript
const { test, expect } = require('@playwright/test');

test('should navigate to page', async ({ page }) => {
  await page.goto('/welcome.html');
  await expect(page.locator('h1')).toContainText('Velkommen');
});
```

## Test utilities

Global test utilities er tilgjengelige i alle tester via `global.testUtils`:

```javascript
// Lag test-deltaker
const participant = global.testUtils.createTestParticipant({
  first_name: 'Test',
  age: 15
});

// Lag test-event
const event = global.testUtils.createTestEvent({
  event_name: 'Min Test Event'
});
```

## CI/CD

Testene kjøres automatisk på GitHub Actions ved:
- Push til master/main/develop branch
- Pull requests

Se `.github/workflows/test.yml` for detaljer.

## Debugging tester

### Jest (unit/integration)
```bash
# Kjør spesifikk test fil
npm test -- participant.test.js

# Kjør tester med --verbose
npm test -- --verbose

# Kjør tester i watch mode
npm run test:watch
```

### Playwright (E2E)
```bash
# Kjør med UI mode (best for debugging)
npm run test:e2e:ui

# Kjør spesifikk test fil
npx playwright test welcome.spec.js

# Kjør i headed mode (se nettleseren)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Skrive gode tester

### Best practices:

1. **Arrange-Act-Assert**: Organiser testen i tre deler
   ```javascript
   test('example', () => {
     // Arrange: Setup
     const input = 'test';

     // Act: Utfør handling
     const result = processInput(input);

     // Assert: Verifiser resultat
     expect(result).toBe('expected');
   });
   ```

2. **Test én ting om gangen**: Hver test skal teste ett spesifikt scenario

3. **Gode testnavn**: Beskriv hva testen gjør
   ```javascript
   test('should return 404 when participant not found', ...)
   ```

4. **Unngå hardkodede verdier**: Bruk testUtils eller konstanter

5. **Cleanup**: Rydd opp etter tester med `afterEach` / `afterAll`

## Troubleshooting

### "Cannot find module"
Kjør `npm install` på nytt

### Playwright tests feiler
Sjekk at browsers er installert: `npx playwright install`

### Port already in use
Test-serveren bruker port 3001 (ikke 3000) for å unngå konflikt

### Database errors
Testene bruker in-memory database (`:memory:`) som definert i `setup.js`

## Ressurser

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
