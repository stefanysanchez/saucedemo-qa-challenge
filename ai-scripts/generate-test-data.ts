import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'checkout.data.ts');
const MODEL = 'gemini-flash-latest';

async function generateCheckoutData(): Promise<CheckoutInfo> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY no está definida en el archivo .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text:
                'Genera datos ficticios y realistas para un formulario de checkout de e-commerce: ' +
                'un nombre, un apellido y un código postal de 5 dígitos (formato EE.UU.). ' +
                'Responde ÚNICAMENTE con un objeto JSON válido con las claves exactas ' +
                '"firstName", "lastName" y "postalCode". Sin texto adicional, sin markdown, sin backticks.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Gemini (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleanText = rawText.replace(/```json|```/g, '').trim();

  const parsed = JSON.parse(cleanText);

  if (!parsed.firstName || !parsed.lastName || !parsed.postalCode) {
    throw new Error('La respuesta de la IA no tiene el formato esperado.');
  }

  return parsed as CheckoutInfo;
}

function writeCheckoutDataFile(data: CheckoutInfo) {
  const fileContent = `import { CheckoutInfo } from '../types';

// Generado dinámicamente por ai-scripts/generate-test-data.ts el ${new Date().toISOString()}
// Fuente: Google Gemini API (${MODEL})
export const checkoutData: CheckoutInfo = ${JSON.stringify(data, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, fileContent, 'utf-8');
}

async function main() {
  console.log('Generando datos de checkout con IA (Gemini)...');
  try {
    const data = await generateCheckoutData();
    writeCheckoutDataFile(data);
    console.log('Datos generados y escritos en src/data/checkout.data.ts:');
    console.log(data);
  } catch (error) {
    console.error('Fallo la generación por IA. Se mantiene el archivo checkout.data.ts existente.');
    console.error(error);
    process.exit(1);
  }
}

main();
