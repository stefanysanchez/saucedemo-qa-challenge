import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';
import { checkoutData } from '../../src/data/checkout.data';


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
