import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNasdaqLikeTxt } from './parser.mjs';

const NASDAQ_LISTED_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt';
const OTHER_LISTED_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_OUTPUT_DIR = path.join(__dirname, 'output');

const downloadText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }
  return response.text();
};

const writeJson = async (filePath, data) => {
  const json = JSON.stringify(data, null, 2);
  await writeFile(filePath, json, 'utf8');
};

export const generateTickerJsonFiles = async (outputDir = DEFAULT_OUTPUT_DIR) => {
  await mkdir(outputDir, { recursive: true });

  const [nasdaqRaw, otherRaw] = await Promise.all([
    downloadText(NASDAQ_LISTED_URL),
    downloadText(OTHER_LISTED_URL)
  ]);

  const nasdaqObject = parseNasdaqLikeTxt(nasdaqRaw);
  const otherObject = parseNasdaqLikeTxt(otherRaw);

  const nasdaqOutputPath = path.join(outputDir, 'nasdaq-listed.json');
  const otherOutputPath = path.join(outputDir, 'other-listed.json');

  await Promise.all([
    writeJson(nasdaqOutputPath, nasdaqObject),
    writeJson(otherOutputPath, otherObject)
  ]);

  return {
    nasdaqOutputPath,
    otherOutputPath,
    nasdaqCount: Object.keys(nasdaqObject).length,
    otherCount: Object.keys(otherObject).length
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  generateTickerJsonFiles()
    .then((result) => {
      console.log('Done');
      console.log(`- nasdaq-listed: ${result.nasdaqCount} items -> ${result.nasdaqOutputPath}`);
      console.log(`- other-listed: ${result.otherCount} items -> ${result.otherOutputPath}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
