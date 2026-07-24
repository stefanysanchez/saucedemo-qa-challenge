import { test, expect } from '../../src/fixtures/pages.fixture';
import { users } from '../../src/data/users.data';

test.describe('Login - SauceDemo', () => {

  test('escenario negativo: usuario bloqueado (locked_out_user)', async ({ loginPage }) => {
    await loginPage.goto('/');
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    const error = await loginPage.getErrorText();
    expect(error).toContain('locked out');
  });

  test('escenario negativo: contraseña inválida', async ({ loginPage }) => {
    await loginPage.goto('/');
    await loginPage.login(users.standard.username, 'contraseña_incorrecta');
    const error = await loginPage.getErrorText();
    expect(error).toContain('do not match');
  });

  test('escenario negativo: campos vacíos', async ({ loginPage }) => {
    await loginPage.goto('/');
    await loginPage.login('', '');
    const error = await loginPage.getErrorText();
    expect(error).toContain('Username is required');
  });

});
