import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNasdaqLikeTxt, pickEtfTickers } from './parser.mjs';

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
    return { parsed, etfs: pickEtfTickers(raw) };
  } catch (error) {
    try {
      const fallback = await readJson(outputPath);
      console.warn(`[ticker:parse] ${label} download failed. Using cached file: ${outputPath}`);
      console.warn(`[ticker:parse] Cause: ${error instanceof Error ? error.message : String(error)}`);
      /* 캐시 파일에는 ETF 열이 없다 — ETF 목록은 이번 회차에 만들지 못한다(아래에서 기존 파일을 둔다). */
      return { parsed: fallback, etfs: null };
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

  const etfOutputPath = path.join(outputDir, 'etf-listed.json');

  const [nasdaq, other] = await Promise.all([
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

  /*
   * ETF 목록(`{ 티커: 종목명 }`) — ETF 겹침 화면의 검색 목록 원천(`scripts/etfHoldings`).
   * 🔴 두 원본을 **둘 다** 새로 받았을 때만 쓴다. 한쪽만 받은 채 쓰면 나머지 거래소의 ETF 가
   *    목록에서 통째로 사라진다 — 그럴 바에는 지난 파일을 그대로 두는 편이 정확하다.
   * 키를 정렬해 쓴다: 내용이 같으면 파일도 같아야 갱신 PR 이 빈 diff 로 끝난다.
   */
  let etfCount = null;
  if (nasdaq.etfs && other.etfs) {
    const merged = { ...other.etfs, ...nasdaq.etfs };
    const sorted = Object.fromEntries(Object.keys(merged).sort().map((ticker) => [ticker, merged[ticker]]));
    await writeJson(etfOutputPath, sorted);
    etfCount = Object.keys(sorted).length;
  } else {
    console.warn(`[ticker:parse] etf-listed skipped (a download failed). Keeping the previous file: ${etfOutputPath}`);
  }

  return {
    nasdaqOutputPath,
    otherOutputPath,
    etfOutputPath,
    nasdaqCount: Object.keys(nasdaq.parsed).length,
    otherCount: Object.keys(other.parsed).length,
    etfCount
  };
};

if (import.meta.url === `file://${process.argv[1]}`) {
  generateTickerJsonFiles()
    .then((result) => {
      console.log('Done');
      console.log(`- nasdaq-listed: ${result.nasdaqCount} items -> ${result.nasdaqOutputPath}`);
      console.log(`- other-listed: ${result.otherCount} items -> ${result.otherOutputPath}`);
      console.log(`- etf-listed: ${result.etfCount ?? 'skipped'} items -> ${result.etfOutputPath}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
