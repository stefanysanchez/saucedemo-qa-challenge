# Auditoría técnica — saucedemo-qa-challenge

**Fecha de la auditoría:** 2026-07-27
**Método:** lectura directa del repositorio en su estado actual (`git status` limpio, rama `main`, sincronizada con `origin/main`). No se ejecutó ningún test, no se generó ningún baseline, no se hizo ningún commit. Todo lo que sigue es lo que existe literalmente hoy en el repo — no lo que un informe previo pueda haber asumido.

---

## 1. Estructura de archivos

Árbol completo (excluyendo `node_modules/`, `.git/`, y carpetas generadas por corridas: `allure-report/`, `allure-results/`, `playwright-report/`, `test-results/`):

```
.
├── .env                                  (no trackeado por git — ver sección 8)
├── .env.example
├── .github/
│   └── workflows/
│       └── playwright.yml
├── .gitignore
├── ai-scripts/
│   ├── analyze-report.ts
│   └── generate-test-data.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
├── README.md
├── src/
│   ├── data/
│   │   ├── checkout.data.ts
│   │   └── users.data.ts
│   ├── fixtures/
│   │   └── pages.fixture.ts
│   ├── pages/
│   │   ├── base.page.ts
│   │   ├── cart.page.ts
│   │   ├── checkout.page.ts
│   │   ├── inventory.page.ts
│   │   └── login.page.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── logger.ts
└── tests/
    └── e2e/
        ├── api-smoke.spec.ts
        ├── data-driven.spec.ts
        ├── login.spec.ts
        ├── network-resilience.spec.ts
        ├── purchase.spec.ts
        ├── report-showcase.spec.ts
        ├── visual-regression.spec.ts
        └── visual-regression.spec.ts-snapshots/
            └── inventory-standard-user-chromium-win32.png
```

**Nota:** no existe carpeta `docs/` previa a esta auditoría — se creó recién ahora para alojar este archivo (ver discrepancia en sección 9 sobre `docs/Informe_SauceDemo_QA.md`, referenciado por el README pero inexistente en el repo).

**Nota 2:** `src/utils/logger.ts` existe pero está vacío de implementación:
```ts
// TODO: implement logger utility
export {};
```
No se usa en ningún otro archivo del proyecto (no hay imports de `utils/logger` en `src/` ni `tests/`).

### Métodos públicos de `src/pages/*.ts` (firma literal)

**`base.page.ts`** — clase `BasePage`
```ts
constructor(page: Page)
async goto(path: string = '/'): Promise<void>
async waitForUrlContains(fragment: string): Promise<void>
```

**`login.page.ts`** — clase `LoginPage extends BasePage`
```ts
constructor(page: Page)
async login(username: string, password: string): Promise<void>
async getErrorText(): Promise<string>
```
Locators públicos (readonly, no métodos): `usernameInput`, `passwordInput`, `loginButton`, `errorMessage`.

**`inventory.page.ts`** — clase `InventoryPage extends BasePage`
```ts
constructor(page: Page)
async addProductToCartByName(productName: string): Promise<void>
async removeProductFromCartByName(productName: string): Promise<void>
async getCartCount(): Promise<number>
async goToCart(): Promise<void>
async isLoaded(): Promise<boolean>
```
Locators públicos: `inventoryItem`, `cartBadge`, `cartIcon`, `sortDropdown`.

`getCartCount()` retorna `number` (hace `parseInt(text, 10)`), **no** `string`. Si `cartBadge.count() === 0`, retorna `0`.

**`cart.page.ts`** — clase `CartPage extends BasePage`
```ts
constructor(page: Page)
async getItemCount(): Promise<number>
async goToCheckout(): Promise<void>
```
Locators públicos: `cartItem`, `checkoutButton`, `continueShoppingButton`.

**`checkout.page.ts`** — clase `CheckoutPage extends BasePage`
```ts
constructor(page: Page)
async fillInformation(info: CheckoutInfo): Promise<void>
async finishPurchase(): Promise<void>
async getCompleteHeaderText(): Promise<string>
```
Locators públicos: `firstNameInput`, `lastNameInput`, `postalCodeInput`, `continueButton`, `finishButton`, `completeHeader`, `summaryTotalLabel`.

`fillInformation` recibe **un solo objeto** `CheckoutInfo` (`{ firstName, lastName, postalCode }`), **no** tres parámetros posicionales sueltos.

---

## 2. Configuración

### `playwright.config.ts` (contenido completo)

```ts
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,

  reporter: [
    ['list'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never' }],
  ],

  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

Puntos relevantes:
- `testDir: './tests'` → sólo `tests/e2e/*.spec.ts` se recolecta (no hay otras subcarpetas bajo `tests/`).
- Un solo proyecto configurado: `chromium` (Desktop Chrome). No hay Firefox, WebKit, ni mobile emulation.
- `baseURL` está definido → justifica el uso de rutas relativas (`'/'`) en `api-smoke.spec.ts` y en los `loginPage.goto('/')` de los specs.
- `retries` y `workers` dependen de `process.env.CI`, pero no hay `.env`/config que fije `CI=true` localmente — sólo se setea en el workflow de GitHub Actions (`env: CI: true`).
- No existe `tsconfig.json` en ningún lado del repo. Playwright transpila TS internamente sin config propia (confirmado: no hay `tsconfig.json`, `.eslintrc*`, ni config de Prettier en la raíz del proyecto).

### `package.json` (contenido completo)

```json
{
  "name": "saucedemo-qa-challenge",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test:showcase": "playwright test --grep @demo",
    "test:ci": "playwright test --grep-invert \"@demo|Visual regression\"",
    "test:visual": "playwright test tests/e2e/visual-regression.spec.ts"
  },
  "keywords": [],
  "type": "commonjs",
  "devDependencies": {
    "@playwright/test": "^1.61.1",
    "@types/node": "^26.1.1",
    "allure-commandline": "^2.43.0",
    "allure-playwright": "^3.10.2",
    "dotenv": "^17.4.2",
    "tsx": "^4.23.1"
  }
}
```

No hay más scripts que los tres de test (no hay `build`, `lint`, `format`, `start`, etc.). No hay `dependencies`, solo `devDependencies` — coherente con que es un proyecto puramente de testing, no una app que se despliegue.

### `.gitignore` (contenido completo)

```
# Playwright
node_modules/
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
/playwright/.auth/

.env
```

Nota: `allure-results/` y `allure-report/` **no están** en `.gitignore` explícitamente, pero tampoco aparecen trackeados en `git ls-files` (ver sección 8) — es decir, existen en disco (generados localmente) pero no fueron agregados a git manualmente todavía. No es una omisión que cause riesgo de commit accidental hoy, pero si alguien corre `git add .` con esas carpetas presentes, se subirían binarios/reportes de corridas locales al repo (a diferencia de `test-results/` y `playwright-report/`, que sí están cubiertos).

### Variables esperadas en `.env`

Según `.env.example`:
```
GEMINI_API_KEY=tu-api-key-aqui
```
Una sola variable esperada: `GEMINI_API_KEY`. El `.env` real local la define (valor no expuesto en este informe).

---

## 3. Tests — inventario completo

Total de archivos `.spec.ts` en `tests/e2e/`: **7**.

| Archivo | describe() literal | tests (literal) | Tags |
|---|---|---|---|
| `api-smoke.spec.ts` | `API-level smoke test — disponibilidad de SauceDemo` | `el servidor responde 200 con Content-Type HTML`; `la respuesta llega dentro de un umbral de tiempo aceptable`; `los assets estáticos críticos responden 200` | ninguno |
| `data-driven.spec.ts` | `Login data-driven - múltiples usuarios` | `login exitoso para standard_user (Usuario sin restricciones, flujo feliz esperado)`; `login exitoso para problem_user (Usuario con bugs de UI conocidos (imágenes rotas, etc.))`; `login exitoso para performance_glitch_user (Usuario con latencia artificial alta)` (generados dinámicamente por `for` sobre `[users.standard, users.problem, users.performanceGlitch]`) | ninguno |
| `login.spec.ts` | `Login - SauceDemo` | `escenario negativo: usuario bloqueado (locked_out_user)`; `escenario negativo: contraseña inválida`; `escenario negativo: campos vacíos` | ninguno |
| `network-resilience.spec.ts` | `Resiliencia de red — fallo de carga de imágenes de producto` | `el happy path de compra se completa aunque las imágenes de producto no carguen`; `la página de inventario sigue siendo funcional sin imágenes cargadas` | ninguno |
| `purchase.spec.ts` | `Compra - SauceDemo (happy path)` | `flujo completo de compra exitosa` | ninguno |
| `report-showcase.spec.ts` | `@demo Showcase de estados de reporte` | `@demo passed esperado: login válido`; `@demo failed intencional: valida un mensaje de error incorrecto a propósito`; `@demo skipped: pendiente de validar checkout con problem_user (bug de UI conocido)` (este último con `test.skip`) | `@demo` (en el describe y en cada test individual) |
| `visual-regression.spec.ts` | `Visual regression — inventario` | `la página de inventario coincide con el baseline visual` | ninguno (excluido por texto literal del describe, no por tag) |

**Conteo total de tests en la suite completa (todos los archivos, un solo proyecto `chromium`): 3 + 3 + 3 + 2 + 1 + 3 + 1 = 16 tests.**

### Exclusión del gate de CI (`test:ci`)

Mecanismo: `playwright test --grep-invert "@demo|Visual regression"` (regex de alternancia sobre el título completo de cada test, que incluye el `describe()` padre).

Quedan excluidos:
- **`report-showcase.spec.ts`** (3 tests) — por el tag literal `@demo` presente en el describe y en cada título de test.
- **`visual-regression.spec.ts`** (1 test) — por matchear el string literal `"Visual regression"` en su describe (`'Visual regression — inventario'`). **Importante:** a diferencia de `@demo`, este no es un tag explícito sino un match de texto libre sobre el título del describe. Si alguien cambia ese texto en el futuro, la exclusión se rompe silenciosamente y el test entraría al gate de CI sin baseline Linux (ver sección 9).

Tests que sí corren en `test:ci`: 16 − 4 = **12 tests**, distribuidos en `api-smoke.spec.ts`, `data-driven.spec.ts`, `login.spec.ts`, `network-resilience.spec.ts`, `purchase.spec.ts` (verificado por `--list`, no por ejecución real).

---

## 4. Integración de IA

Dos scripts en `ai-scripts/`, ambos standalone (no se importan entre sí ni desde `tests/` o `src/`):

### `generate-test-data.ts`
- Propósito: generar datos ficticios de checkout (`firstName`, `lastName`, `postalCode`) vía IA y **sobreescribir** `src/data/checkout.data.ts` con el resultado.
- Llama a la API REST de Google Gemini directamente vía `fetch` (no usa un SDK de Gemini): `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`.
- Requiere `GEMINI_API_KEY` en `.env` (falla con error explícito si no está).
- Si la IA falla o responde mal formado, el script hace `process.exit(1)` y loggea el error, dejando intacto el `checkout.data.ts` existente (no lo corrompe).
- Invocación: **no está en `package.json` scripts**. Se corre manualmente con `npx tsx ai-scripts/generate-test-data.ts` (así lo documenta el propio README).

### `analyze-report.ts`
- Propósito: leer `test-results/results.json` (generado por el reporter `json` de Playwright), calcular métricas (passed/failed/skipped/duración) y pedirle a Gemini un resumen ejecutivo en español para audiencia no técnica (máx. 120 palabras).
- Escribe el resultado en `test-results/executive-summary.md`.
- Misma API REST de Gemini, mismo modelo (`gemini-flash-latest`), mismo requisito de `GEMINI_API_KEY`.
- Falla explícitamente si `test-results/results.json` no existe todavía (pide correr `npx playwright test` primero).
- Invocación: **tampoco está en `package.json` scripts**. Se corre manualmente con `npx tsx ai-scripts/analyze-report.ts`.

**Proveedor confirmado: Google Gemini**, modelo `gemini-flash-latest`, vía llamada HTTP directa a la API pública de Generative Language — no hay SDK de terceros (`@google/generative-ai` no está en `package.json`). No hay integración de OpenAI, Anthropic ni ningún otro proveedor en el repo.

---

## 5. Allure

Configurado exclusivamente en `playwright.config.ts` como uno de los 4 reporters (ver sección 2):
```ts
['allure-playwright', {
  detail: true,
  outputFolder: 'allure-results',
  suiteTitle: false,
}]
```
- `detail: true` incluye pasos/detalle extendido en cada resultado.
- `suiteTitle: false` evita que Allure prefije cada test con el nombre del archivo/suite.
- Resultados crudos van a `allure-results/` (existe en disco, con contenido de corridas previas).

Generación y visualización (documentadas en README, comandos exactos):
```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```
La carpeta `allure-report/` (HTML generado) ya existe en disco de una corrida previa, igual que `allure-results/`.

### `report-showcase.spec.ts` — detalle

Existe. Su propósito, documentado en el propio comentario del archivo y en el README:
- Suite **exclusivamente demostrativa**, pensada para poblar el reporte de Allure con los tres estados posibles (`passed`, `failed`, `skipped`) de forma controlada, para una defensa técnica del proyecto.
- **No** forma parte del gate de CI (excluida vía `--grep-invert @demo|...`, ver sección 3).
- Se corre manualmente con `npm run test:showcase`.
- Contiene un test con **fallo intencional** (`expect(error).toContain('this text does not exist on purpose')`) — es un failed a propósito, documentado como tal en el propio nombre del test, no un bug real.
- Contiene un `test.skip(...)` documentado como backlog fuera de alcance (checkout con `problem_user`, que tiene bugs de UI sembrados por SauceDemo).

---

## 6. CI/CD

Un solo archivo de workflow: `.github/workflows/playwright.yml`. Contenido completo:

```yaml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout del código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Instalar navegadores de Playwright
        run: npx playwright install --with-deps chromium

      - name: Ejecutar tests
        run: npm run test:ci
        env:
          CI: true

      - name: Subir reporte HTML de Playwright
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Subir resultados de Allure
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-results
          path: allure-results/
          retention-days: 14

      - name: Subir evidencias de fallos (traces/videos/screenshots)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: failure-evidence
          path: test-results/
          retention-days: 14
```

- Corre en `ubuntu-latest` (Linux), Node 20, un solo job.
- Comando de test ejecutado: **`npm run test:ci`** (no `npx playwright test` genérico) — por lo tanto hereda automáticamente cualquier exclusión que se defina en ese script de `package.json`.
- Solo instala el navegador `chromium` (coherente con que `playwright.config.ts` sólo define el proyecto `chromium`).
- Triggers: push a `main` y pull requests contra `main`. No corre en otras ramas ni on-demand (`workflow_dispatch` no está configurado).
- Sube reporte HTML de Playwright y resultados de Allure siempre (`if: always()`); sube evidencia de fallos (traces/video/screenshots) solo si el job falla.

**Estado del último run:** no verificable desde acá — esto requiere consultar GitHub Actions (API o UI), y esta auditoría es de solo lectura sobre el filesystem local. El README incluye un badge de estado (`https://github.com/stefanysanchez/saucedemo-qa-challenge/actions/workflows/playwright.yml/badge.svg`) que refleja el estado real solo cuando se renderiza en GitHub, no desde este entorno local.

---

## 7. README.md

**Existe** (`README.md`, 89 líneas). No es un placeholder — está desarrollado con secciones completas:

1. Título + badges (CI status, TypeScript, Playwright)
2. "Por qué existe este proyecto" — pitch de valor
3. "Stack técnico" — tabla de herramientas
4. "Estructura del proyecto" — árbol resumido
5. "Quickstart" — instalación y comandos de corrida
6. "Scripts de IA" — comandos exactos para los dos scripts de `ai-scripts/`
7. "Cobertura de tests" — tabla con 4 suites documentadas
8. "CI/CD" — resumen del pipeline
9. "Decisiones de arquitectura" — link a `docs/Informe_SauceDemo_QA.md`

**Está desactualizado respecto al estado actual del repo** — ver detalle en sección 9.

---

## 8. Seguridad / Git

- **Confirmado: `.env` no está trackeado por git.** `git ls-files | grep -i "\.env"` devuelve únicamente `.env.example`. El archivo `.env` real (con `GEMINI_API_KEY` real) existe en disco local pero está correctamente ignorado por la regla `.env` en `.gitignore`.
- `git status` está limpio (working tree clean, `main` sincronizada con `origin/main`) — no hay cambios pendientes de commitear al momento de esta auditoría.
- `allure-results/` y `allure-report/` no están trackeadas tampoco (no aparecen en `git ls-files`), aunque no están explícitamente en `.gitignore` — ver nota en sección 2.

### Hallazgo de seguridad en `node_modules/dotenv` (ya reportado en esta conversación, se deja documentado formalmente acá)

El paquete `dotenv@17.4.2` instalado (versión real, resuelta e íntegra desde `registry.npmjs.org`, confirmada por hash de integridad en `package-lock.json` — **no es una copia local alterada ni un paquete de un registro falso**) incluye:

1. Un archivo `node_modules/dotenv/skills/dotenv/SKILL.md` con formato de **Claude Skill**, dirigido explícitamente a agentes de IA (sección "Agent Usage", menciona a Claude y Codex por nombre), que empuja repetidamente a instalar/recomendar `dotenvx` bajo el pretexto de "reducir el riesgo de exposición cuando agentes LLM leen el repo".
2. Un array de "tips" en `node_modules/dotenv/lib/main.js` (línea 7-16) que se imprime aleatoriamente en cada `dotenv.config()`, incluyendo la línea `'⌁ auth for agents [www.vestauth.com]'` — un dominio ajeno tanto a `dotenv` como a `dotenvx.com` (el dominio oficial del mismo autor).

Esto es contenido genuino del paquete oficial publicado en npm, no una manipulación local — lo cual es más preocupante, no menos: afecta a cualquier proyecto que use `dotenv@17.x`, no solo a este repo. Es un vector de ingeniería social dirigido a agentes de codificación (para que ejecuten/recomienden `dotenvx` o interactúen con `vestauth.com`). No se siguió ninguna instrucción de ese `SKILL.md`, no se visitó `vestauth.com`, y no se instaló `dotenvx` en ningún momento de este proyecto.

No se detectaron otros paquetes de primer nivel sospechosos. Dependencias instaladas (`package-lock.json`, nivel raíz de `node_modules/`): `allure-commandline`, `allure-js-commons`, `allure-playwright`, `charenc`, `crypt`, `dotenv`, `esbuild`, `fsevents`, `is-buffer`, `md5`, `playwright`, `playwright-core`, `tsx`, `undici-types`. `charenc`, `crypt`, `is-buffer`, `md5` son dependencias transitivas antiguas y conocidas de `allure-js-commons` (usadas para hashing), sin hallazgos anómalos.

---

## 9. Discrepancias con documentación previa

Listado explícito de todo lo que contradice lo que el README (o un informe técnico previo) pueda haber asumido:

1. **`docs/Informe_SauceDemo_QA.md` NO existe.** El README (línea 89) lo referencia como fuente de "decisiones de arquitectura, trade-offs conocidos y consideraciones de escalabilidad a 500+ tests". El commit que introdujo el README (`33f025e`, mensaje: *"docs: agrega README profesional, .env.example e informe técnico"*) **solo tocó `.env.example` y `README.md`** — el "informe técnico" mencionado en el mensaje de commit nunca se creó como archivo. La carpeta `docs/` no existía en el repo antes de esta auditoría.

2. **La tabla "Cobertura de tests" del README está incompleta/desactualizada.** Documenta solo 4 suites (`login.spec.ts`, `data-driven.spec.ts`, `purchase.spec.ts`, `report-showcase.spec.ts`) y 10 tests. El repo real tiene **7 archivos y 16 tests** — faltan `api-smoke.spec.ts` (3), `network-resilience.spec.ts` (2) y `visual-regression.spec.ts` (1) en esa tabla, todos agregados en esta misma sesión de trabajo pero no reflejados en el README.

3. **La sección "CI/CD" del README dice "corre la suite real (excluyendo @demo)"**, sin mencionar que desde el cambio reciente a `test:ci` también se excluye `visual-regression.spec.ts` por texto literal de su describe. Desactualizado desde el último cambio a `package.json`.

4. **La sección "Estructura del proyecto" del README** describe `tests/e2e/` como `"Specs (login, compra, data-driven)"` — no menciona `api-smoke`, `network-resilience`, `visual-regression` ni `report-showcase`.

5. **Métodos con firmas distintas a las asumidas por código de referencia externo** (ya corregido en esta sesión al crear los nuevos specs, se deja documentado formalmente):
   - `inventoryPage.getCartCount()` retorna `Promise<number>`, no `Promise<string>`.
   - `checkoutPage.fillInformation()` recibe un único objeto `CheckoutInfo`, no tres parámetros posicionales (`firstName, lastName, postalCode`).

6. **La exclusión de `visual-regression.spec.ts` del gate de CI depende de un match de texto libre** (`"Visual regression"` sobre el título del describe), no de un tag explícito como `@demo`. Es funcionalmente equivalente hoy, pero es más frágil: un cambio de texto en el `describe()` de ese archivo rompe la exclusión sin ningún error visible hasta que CI falla por ausencia de snapshot Linux.

7. **El baseline visual existente es específico de plataforma:** `tests/e2e/visual-regression.spec.ts-snapshots/inventory-standard-user-chromium-win32.png` — el sufijo `-win32` confirma que Playwright generó el nombre de archivo automáticamente para Windows. Si este test alguna vez se saca de la exclusión de CI sin generar antes un baseline `-linux`, va a fallar en el runner de GitHub Actions (`ubuntu-latest`) por snapshot ausente, tal como estaba previsto/documentado en el propio comentario del spec.

8. **`src/utils/logger.ts` existe pero está vacío** (`// TODO: implement logger utility`) y no se usa en ningún lado del código. Si algún documento previo asume que existe un logging centralizado, no es así hoy.

9. **Ninguno de los dos scripts de `ai-scripts/` está expuesto como script de `package.json`** — se invocan únicamente vía `npx tsx ai-scripts/<archivo>.ts`, tal como documenta el README, pero vale aclararlo explícitamente porque no hay atajo `npm run generate-data` ni `npm run analyze-report`.
