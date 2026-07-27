import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';
import { checkoutData } from '../../src/data/checkout.data';

/**
 * Test de intercepción de red con page.route().
 *
 * SauceDemo no tiene un endpoint de login para mockear (ver api-smoke.spec.ts
 * para el detalle de esa limitación), así que en vez de fingir un mock que no
 * refleja el comportamiento real de la app, se interviene una condición de
 * red que SÍ existe: la carga de imágenes de producto.
 *
 * Objetivo del test: verificar que el flujo crítico de compra (happy path)
 * no se rompe cuando la red degrada — imágenes que fallan en cargar (CDN
 * caído, timeout, bloqueo de assets) no deberían impedir que el usuario
 * complete un checkout. Esto es exactamente el tipo de escenario que un
 * bug en producción real podría exponer y que un test puramente funcional
 * (sin intervención de red) nunca detectaría.
 */
test.describe('Resiliencia de red — fallo de carga de imágenes de producto', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*.{jpg,jpeg,png,webp}', (route) => route.abort());
  });

  test('el happy path de compra se completa aunque las imágenes de producto no carguen', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    await inventoryPage.addProductToCartByName('Sauce Labs Backpack');
    await inventoryPage.addProductToCartByName('Sauce Labs Bike Light');
    expect(await inventoryPage.getCartCount()).toBe(2);

    await inventoryPage.goToCart();
    expect(await cartPage.getItemCount()).toBe(2);

    await cartPage.goToCheckout();
    await checkoutPage.fillInformation(checkoutData);
    await checkoutPage.finishPurchase();

    const confirmationText = await checkoutPage.getCompleteHeaderText();
    expect(confirmationText).toContain('Thank you');
  });

  test('la página de inventario sigue siendo funcional sin imágenes cargadas', async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    expect(await inventoryPage.isLoaded()).toBeTruthy();

    await inventoryPage.addProductToCartByName('Sauce Labs Backpack');
    expect(await inventoryPage.getCartCount()).toBe(1);
  });
});
