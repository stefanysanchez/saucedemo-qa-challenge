# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\report-showcase.spec.ts >> @demo Showcase de estados de reporte >> @demo failed intencional: valida un mensaje de error incorrecto a propósito
- Location: tests\e2e\report-showcase.spec.ts:18:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "this text does not exist on purpose"
Received string:    "Epic sadface: Sorry, this user has been locked out."
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: Swag Labs
  - generic [ref=e5]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - textbox "Username" [ref=e11]: locked_out_user
        - img [ref=e12]
      - generic [ref=e14]:
        - textbox "Password" [ref=e15]: secret_sauce
        - img [ref=e16]
      - 'heading "Epic sadface: Sorry, this user has been locked out." [level=3] [ref=e19]':
        - button [ref=e20] [cursor=pointer]:
          - img [ref=e21]
        - text: "Epic sadface: Sorry, this user has been locked out."
      - button "Login" [active] [ref=e23] [cursor=pointer]
    - generic [ref=e25]:
      - generic [ref=e26]:
        - heading "Accepted usernames are:" [level=4] [ref=e27]
        - text: standard_user
        - text: locked_out_user
        - text: problem_user
        - text: performance_glitch_user
        - text: error_user
        - text: visual_user
      - generic [ref=e28]:
        - heading "Password for all users:" [level=4] [ref=e29]
        - text: secret_sauce
```

# Test source

```ts
  1  | import { test, expect } from '../../src/fixtures/pages.fixture';
  2  | import { users } from '../../src/data/users.data';
  3  | 
  4  | // Suite exclusivamente demostrativa para mostrar el espectro completo de estados
  5  | // en el reporte de Allure (passed, failed, skipped). NO forma parte del gate de CI:
  6  | // se ejecuta manualmente con `npm run test:showcase` antes de generar el reporte
  7  | // para la defensa técnica. Etiquetada con @demo para exclusión selectiva.
  8  | 
  9  | test.describe('@demo Showcase de estados de reporte', () => {
  10 | 
  11 |   test('@demo passed esperado: login válido', async ({ loginPage, inventoryPage }) => {
  12 |     await loginPage.goto('/');
  13 |     await loginPage.login(users.standard.username, users.standard.password);
  14 |     await loginPage.waitForUrlContains('/inventory.html');
  15 |     expect(await inventoryPage.isLoaded()).toBeTruthy();
  16 |   });
  17 | 
  18 |   test('@demo failed intencional: valida un mensaje de error incorrecto a propósito', async ({ loginPage }) => {
  19 |     await loginPage.goto('/');
  20 |     await loginPage.login(users.lockedOut.username, users.lockedOut.password);
  21 |     const error = await loginPage.getErrorText();
> 22 |     expect(error).toContain('this text does not exist on purpose');
     |                   ^ Error: expect(received).toContain(expected) // indexOf
  23 |   });
  24 | 
  25 |   test.skip('@demo skipped: pendiente de validar checkout con problem_user (bug de UI conocido)', async () => {
  26 |     // Se omite intencionalmente: problem_user tiene bugs de UI documentados en SauceDemo
  27 |     // que rompen el flujo de checkout; queda como backlog fuera del alcance de este challenge.
  28 |   });
  29 | 
  30 | });
  31 | 
```