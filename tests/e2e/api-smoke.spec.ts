import { test, expect } from '@playwright/test';

test.describe('API-level smoke test — disponibilidad de SauceDemo', () => {
  const BASE_URL = '/';

  test('el servidor responde 200 con Content-Type HTML', async ({ request }) => {
    const response = await request.get(BASE_URL);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('la respuesta llega dentro de un umbral de tiempo aceptable', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(BASE_URL);
    const elapsedMs = Date.now() - start;

    expect(response.ok()).toBeTruthy();
    // Umbral conservador para un smoke test de disponibilidad, no un test de performance real
    expect(elapsedMs).toBeLessThan(3000);
  });

  test('los assets estáticos críticos responden 200', async ({ request }) => {
    // Verifica a nivel HTTP que el bundle principal no está roto en origen,
    // sin necesidad de parsear el HTML ni levantar un browser.
    const response = await request.get(BASE_URL);
    const body = await response.text();

    const scriptMatch = body.match(/src="(\/static\/js\/[^"]+\.js)"/);
    test.skip(!scriptMatch, 'No se encontró un bundle JS para validar en el HTML devuelto');

    if (scriptMatch) {
      const scriptUrl = scriptMatch[1];
      const scriptResponse = await request.get(scriptUrl);
      expect(scriptResponse.status()).toBe(200);
    }
  });
});
