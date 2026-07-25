import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { EMPTY_MARKET_DATA_SNAPSHOT, parseMarketDataSnapshot } from '@/shared/constants/marketData';
import type { MarketDataSnapshot } from '@/shared/constants/marketData';

import { serializeSnapshot } from './cliOptions';

/**
 * Snapshot file IO shared by every tickerRefresh CLI (`ticker:refresh`, `ticker:paydates`).
 *
 * Extracted because the two CLIs briefly carried their own copies of the path and the read
 * function. Two copies of a *file path* is the dangerous kind of duplication: change one and both
 * pipelines silently operate on different files, each convinced it is fine. One module = one path.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** The single generated snapshot both pipelines read and write. */
export const SNAPSHOT_PATH = path.resolve(__dirname, '../../shared/constants/marketData/marketData.generated.json');

/** Reads the snapshot, falling back to the empty one (with a warning) when missing/corrupt. */
export const readSnapshotFile = async (logPrefix: string): Promise<MarketDataSnapshot> => {
  try {
    return parseMarketDataSnapshot(JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8')));
  } catch {
    console.warn(`${logPrefix} No readable snapshot at ${SNAPSHOT_PATH}; starting empty.`);
    return EMPTY_MARKET_DATA_SNAPSHOT;
  }
};

export const writeSnapshotFile = async (snapshot: MarketDataSnapshot): Promise<void> => {
  await writeFile(SNAPSHOT_PATH, serializeSnapshot(snapshot), 'utf8');
};

/**
 * `.env` fallback for CLI-only secrets (e.g. `ALPHAVANTAGE_API_KEY`).
 *
 * `vite-node` does not put non-`VITE_` variables on `process.env`, and these keys must never carry
 * a `VITE_` prefix (that would ship them to the browser bundle). Parsed by hand — the same
 * zero-dependency rule the rest of the tooling follows. A real environment variable always wins
 * over the file, so CI can override without editing anything.
 */
export const readCliEnv = (name: string): string | null => {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;

  try {
    const raw = readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator <= 0) continue;
      if (trimmed.slice(0, separator).trim() !== name) continue;

      let value = trimmed.slice(separator + 1).trim();
      if (value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'")) {
        value = value.slice(1, -1);
      }
      return value.length > 0 ? value : null;
    }
  } catch {
    // No .env is fine — CI injects real environment variables instead.
  }
  return null;
};
