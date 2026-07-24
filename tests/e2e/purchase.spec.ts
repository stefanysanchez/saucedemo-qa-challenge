import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';
import { checkoutData } from '../../src/data/checkout.data';

test.describe('Compra - SauceDemo (happy path)', () => {

  test('flujo completo de compra exitosa', async ({ loginPage, inventoryPage, cartPage, checkoutPage }) => {
    await loginPage.goto('/');
    await loginPage.login(users.standard.username, users.standard.password);
    await loginPage.waitForUrlContains('/inventory.html');

    await inventoryPage.addProductToCartByName('Sauce Labs Backpack');
    await inventoryPage.addProductToCartByName('Sauce Labs Bike Light');
    expect(await inventoryPage.getCartCount()).toBe(2);

    await inventoryPage.goToCart();
    await loginPage.waitForUrlContains('/cart.html');
    expect(await cartPage.getItemCount()).toBe(2);

    await cartPage.goToCheckout();
    await loginPage.waitForUrlContains('/checkout-step-one.html');

    await checkoutPage.fillInformation(checkoutData);
    await loginPage.waitForUrlContains('/checkout-step-two.html');

    await checkoutPage.finishPurchase();
    await loginPage.waitForUrlContains('/checkout-complete.html');

    const completeText = await checkoutPage.getCompleteHeaderText();
    expect(completeText).toContain('Thank you');
  });

});
