import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';

const usersToTest = [users.standard, users.problem, users.performanceGlitch];

test.describe('Login data-driven - múltiples usuarios', () => {

  for (const user of usersToTest) {
    test(`login exitoso para ${user.username} (${user.description})`, async ({ loginPage, inventoryPage }) => {
      await loginPage.goto('/');
      await loginPage.login(user.username, user.password);
      await loginPage.waitForUrlContains('/inventory.html');
      expect(await inventoryPage.isLoaded()).toBeTruthy();
    });
  }

});
