import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';

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
