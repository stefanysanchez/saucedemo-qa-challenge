import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-flash-latest';
const RESULTS_PATH = path.join(__dirname, '..', 'test-results', 'results.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'test-results', 'executive-summary.md');

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  failedTestTitles: string[];
}

function readAndSummarizeResults(): TestSummary {
  if (!fs.existsSync(RESULTS_PATH)) {
    throw new Error(
      `No se encontró ${RESULTS_PATH}. Corre "npx playwright test" primero para generar el reporte JSON.`
    );
  }

  const raw = fs.readFileSync(RESULTS_PATH, 'utf-8');
  const json = JSON.parse(raw);

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failedTestTitles: string[] = [];

  function walkSuites(suites: any[]) {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          const outcome = test.results?.[0]?.status;
          if (outcome === 'passed') passed++;
          else if (outcome === 'failed' || outcome === 'timedOut') {
            failed++;
            failedTestTitles.push(spec.title);
          } else if (outcome === 'skipped') skipped++;
        }
      }
      if (suite.suites) walkSuites(suite.suites);
    }
  }

  walkSuites(json.suites);

  return {
    totalTests: passed + failed + skipped,
    passed,
    failed,
    skipped,
    durationMs: json.stats?.duration ?? 0,
    failedTestTitles,
  };
}

async function generateExecutiveSummary(summary: TestSummary): Promise<string> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY no está definida en el archivo .env');
  }

  const prompt = `Eres un asistente que redacta resúmenes ejecutivos de resultados de pruebas de software
para un público de negocio NO técnico (gerentes, product owners, clientes).

Datos de la última ejecución de tests automatizados:
- Total de tests: ${summary.totalTests}
- Exitosos: ${summary.passed}
- Fallidos: ${summary.failed}
- Omitidos: ${summary.skipped}
- Duración total: ${(summary.durationMs / 1000).toFixed(1)} segundos
- Tests fallidos (si los hay): ${summary.failedTestTitles.join(', ') || 'Ninguno'}

Redacta un resumen ejecutivo breve (máximo 120 palabras) en español, sin jerga técnica,
que explique el estado de calidad del sistema y si es seguro proceder con un release.
No uses markdown ni encabezados, solo texto plano en párrafos.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Gemini (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.trim();
}

function writeSummaryFile(summary: TestSummary, executiveSummary: string) {
  const content = `# Resumen Ejecutivo de Ejecución de Tests

**Generado:** ${new Date().toISOString()}
**Fuente:** ai-scripts/analyze-report.ts (Google Gemini API - ${MODEL})

## Métricas

- Total de tests: ${summary.totalTests}
- Exitosos: ${summary.passed}
- Fallidos: ${summary.failed}
- Omitidos: ${summary.skipped}
- Duración: ${(summary.durationMs / 1000).toFixed(1)}s

## Resumen para negocio

${executiveSummary}
`;

  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
}

async function main() {
  console.log('Leyendo resultados de Playwright...');
  try {
    const summary = readAndSummarizeResults();
    console.log(`Encontrados: ${summary.totalTests} tests (${summary.passed} passed, ${summary.failed} failed)`);

    console.log('Generando resumen ejecutivo con IA (Gemini)...');
    const executiveSummary = await generateExecutiveSummary(summary);

    writeSummaryFile(summary, executiveSummary);
    console.log(`Resumen ejecutivo escrito en: ${OUTPUT_PATH}`);
    console.log('\n--- Resumen ---\n');
    console.log(executiveSummary);
  } catch (error) {
    console.error('Fallo la generación del resumen ejecutivo.');
    console.error(error);
    process.exit(1);
  }
}

main();
