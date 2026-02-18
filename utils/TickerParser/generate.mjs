import { mkdir, readFile, writeFile } from 'node:fs/promises';
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

const readJson = async (filePath) => {
  const json = await readFile(filePath, 'utf8');
  return JSON.parse(json);
};

const loadRemoteOrFallback = async ({ label, url, outputPath }) => {
  try {
    const raw = await downloadText(url);
    const parsed = parseNasdaqLikeTxt(raw);
    await writeJson(outputPath, parsed);
    return parsed;
  } catch (error) {
    try {
      const fallback = await readJson(outputPath);
      console.warn(`[ticker:parse] ${label} download failed. Using cached file: ${outputPath}`);
      console.warn(`[ticker:parse] Cause: ${error instanceof Error ? error.message : String(error)}`);
      return fallback;
    } catch {
      throw new Error(
        `[ticker:parse] ${label} download failed and cached file is not available: ${outputPath}`,
        { cause: error }
      );
    }
  }
};

export const generateTickerJsonFiles = async (outputDir = DEFAULT_OUTPUT_DIR) => {
  await mkdir(outputDir, { recursive: true });

  const nasdaqOutputPath = path.join(outputDir, 'nasdaq-listed.json');
  const otherOutputPath = path.join(outputDir, 'other-listed.json');

  const [nasdaqObject, otherObject] = await Promise.all([
    loadRemoteOrFallback({
      label: 'nasdaq-listed',
      url: NASDAQ_LISTED_URL,
      outputPath: nasdaqOutputPath
    }),
    loadRemoteOrFallback({
      label: 'other-listed',
      url: OTHER_LISTED_URL,
      outputPath: otherOutputPath
    })
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
