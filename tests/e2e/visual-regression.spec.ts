import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';

/**
 * Visual regression test — página de inventario.
 *
 * Feature nativa de Playwright (toHaveScreenshot) que compara una captura
 * actual contra un baseline versionado en el repo. A diferencia de los
 * asserts funcionales (que verifican comportamiento), esto detecta
 * regresiones puramente visuales: un CSS roto, un elemento desalineado,
 * un cambio de layout no intencional que ningún test funcional atraparía
 * porque el flujo "sigue funcionando" aunque se vea mal.
 *
 * Decisiones de diseño:
 * - standard_user en vez de problem_user: problem_user tiene imágenes de
 *   producto rotas a propósito (bug sembrado por SauceDemo), lo cual
 *   volvería el baseline no determinístico / inútil como referencia.
 * - Carrito vacío al momento de la captura: el test no agrega productos
 *   antes de la screenshot, así el badge del carrito no aparece y no se
 *   vuelve una fuente de diffs falsos entre corridas.
 * - animations: 'disabled' congela CSS transitions/animations antes de
 *   capturar, evitando falsos positivos por timing.
 * - maxDiffPixelRatio con margen pequeño: tolera diferencias de
 *   sub-pixel rendering (antialiasing, hinting de fuentes) sin dejar
 *   pasar una regresión real de layout.
 *
 * Nota importante (documentada también en el informe): el baseline
 * generado acá es específico de la plataforma donde se corrió por
 * primera vez (Windows local). Si este test se agrega al pipeline de
 * CI (Bloque 3, runner Linux), el baseline va a tener que regenerarse
 * dentro de ese entorno — es un comportamiento esperado de Playwright,
 * no un bug del test.
 */
test.describe('@visual Visual regression — inventario', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('la página de inventario coincide con el baseline visual', async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    const isLoaded = await inventoryPage.isLoaded();
    expect(isLoaded).toBeTruthy();

    await expect(page).toHaveScreenshot('inventory-standard-user.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});
