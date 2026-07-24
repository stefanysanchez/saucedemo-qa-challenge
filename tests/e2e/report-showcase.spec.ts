import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';

// Suite exclusivamente demostrativa para mostrar el espectro completo de estados
// en el reporte de Allure (passed, failed, skipped). NO forma parte del gate de CI:
// se ejecuta manualmente con `npm run test:showcase` antes de generar el reporte
// para la defensa técnica. Etiquetada con @demo para exclusión selectiva.

test.describe('@demo Showcase de estados de reporte', () => {

  test('@demo passed esperado: login válido', async ({ loginPage, inventoryPage }) => {
    await loginPage.goto('/');
    await loginPage.login(users.standard.username, users.standard.password);
    await loginPage.waitForUrlContains('/inventory.html');
    expect(await inventoryPage.isLoaded()).toBeTruthy();
  });

  test('@demo failed intencional: valida un mensaje de error incorrecto a propósito', async ({ loginPage }) => {
    await loginPage.goto('/');
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    const error = await loginPage.getErrorText();
    expect(error).toContain('this text does not exist on purpose');
  });

  test.skip('@demo skipped: pendiente de validar checkout con problem_user (bug de UI conocido)', async () => {
    // Se omite intencionalmente: problem_user tiene bugs de UI documentados en SauceDemo
    // que rompen el flujo de checkout; queda como backlog fuera del alcance de este challenge.
  });

});
