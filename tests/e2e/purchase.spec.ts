import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';

test.describe('Compra - SauceDemo (smoke)', () => {

  test('login exitoso y agregar producto al carrito', async ({ loginPage, inventoryPage }) => {
    await loginPage.goto('/');
    await loginPage.login(users.standard.username, users.standard.password);
    await loginPage.waitForUrlContains('/inventory.html');

    expect(await inventoryPage.isLoaded()).toBeTruthy();

    await inventoryPage.addProductToCartByName('Sauce Labs Backpack');
    const cartCount = await inventoryPage.getCartCount();
    expect(cartCount).toBe(1);
  });

});
