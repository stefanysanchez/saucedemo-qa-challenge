import { test, expect } from '@playwright/test';

/**
 * Smoke test a nivel HTTP (no UI).
 *
 * SauceDemo no expone un endpoint de autenticación real (el login se
 * valida 100% client-side contra un array hardcodeado en el bundle JS),
 * por lo que no existe una "respuesta de login" que interceptar o mockear
 * a nivel de API.
 *
 * Lo que SÍ es una verificación de API legítima es chequear la
 * disponibilidad y salud del sitio a nivel de protocolo HTTP, sin
 * levantar un navegador. Esto sirve como gate previo a la suite de UI:
 * si el sitio no responde, no tiene sentido correr Playwright con browser.
 */
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
