# SauceDemo QA Automation Framework

[![Playwright Tests](https://github.com/stefanysanchez/saucedemo-qa-challenge/actions/workflows/playwright.yml/badge.svg)](https://github.com/stefanysanchez/saucedemo-qa-challenge/actions/workflows/playwright.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Playwright](https://img.shields.io/badge/Playwright-latest-green)

Framework de automatización end-to-end para el e-commerce demo **SauceDemo**, construido con **Playwright + TypeScript** bajo el patrón **Page Object Model (POM)**, con reportes enriquecidos vía **Allure**, integración de **IA (Google Gemini)** para generación de datos y análisis de resultados, y un pipeline de **CI/CD en GitHub Actions**.

## Por qué existe este proyecto

Resuelve tres dolores concretos de calidad en e-commerce: bugs que llegan a producción, regresiones manuales lentas, y falta de confianza a la hora de hacer un release. La suite cubre el flujo crítico de compra, escenarios negativos de autenticación, y validación multi-usuario, con evidencia automática (screenshots, video, trace) ante cualquier fallo.

## Stack técnico

| Herramienta | Uso |
|---|---|
| Playwright + TypeScript | Motor de automatización y lenguaje |
| Page Object Model | Arquitectura, separación de capas |
| Allure Report | Reporte de evidencias navegable |
| Google Gemini API | Generación de datos + resumen ejecutivo por IA |
| GitHub Actions | CI/CD |

## Estructura del proyecto

```
src/
├── pages/       Page Objects (sin asserts)
├── fixtures/    Inyección automática de Page Objects
├── data/        Datos de prueba tipados
├── types/       Interfaces compartidas
tests/e2e/       Specs (login, compra, data-driven)
ai-scripts/      Scripts de IA (generación de datos + análisis de resultados)
.github/workflows/  Pipeline de CI
```

## Quickstart

Instalar dependencias:
```bash
npm install
npx playwright install --with-deps chromium
```

Correr la suite completa:
```bash
npx playwright test
```

Ver el reporte HTML nativo de Playwright:
```bash
npx playwright show-report
```

Generar y abrir el reporte de Allure:
```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## Scripts de IA

Requieren una GEMINI_API_KEY en un archivo .env en la raíz (ver .env.example).

Generar datos dinámicos de checkout:
```bash
npx tsx ai-scripts/generate-test-data.ts
```

Generar un resumen ejecutivo en lenguaje natural a partir de la última corrida de tests:
```bash
npx tsx ai-scripts/analyze-report.ts
```

## Cobertura de tests

| Suite | Tests | Qué valida |
|---|---|---|
| login.spec.ts | 3 | Escenarios negativos: usuario bloqueado, contraseña inválida, campos vacíos |
| data-driven.spec.ts | 3 | Login iterando sobre standard_user, problem_user, performance_glitch_user |
| purchase.spec.ts | 1 | Happy path completo: login → carrito → checkout → confirmación |
| report-showcase.spec.ts (@demo) | 3 | Suite demostrativa para evidenciar estados passed/failed/skipped en Allure. Excluida del gate de CI. |

## CI/CD

Cada push a main dispara el workflow de GitHub Actions: instala dependencias, corre la suite real (excluyendo @demo), y publica como artefactos el reporte de Playwright y los resultados de Allure. Evidencia de fallos (trace/video/screenshot) se sube solo si algún test falla.

## Decisiones de arquitectura

Ver el informe técnico completo con justificación de cada decisión, trade-offs conocidos y consideraciones de escalabilidad a 500+ tests en docs/Informe_SauceDemo_QA.md.
