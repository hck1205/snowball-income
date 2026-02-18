import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { normalizePersistedAppState, type PersistedScenarioState } from '@/jotai';

export const SHARE_QUERY_PARAM = 'share';
export const SHARE_VERSION_QUERY_PARAM = 'sv';
export const SHARE_SCHEMA_VERSION = 1;
export const SHARE_LENGTH_LIMIT = 4000;

type SharedScenarioEnvelope = {
  v: number;
  scenario: PersistedScenarioState;
};

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object';

export const encodeSharedScenario = (scenario: PersistedScenarioState): string => {
  const envelope: SharedScenarioEnvelope = {
    v: SHARE_SCHEMA_VERSION,
    scenario
  };
  return compressToEncodedURIComponent(JSON.stringify(envelope));
};

export const decodeSharedScenario = (encoded: string): PersistedScenarioState | null => {
  const decodedText = decompressFromEncodedURIComponent(encoded);
  if (!decodedText) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodedText);
  } catch {
    return null;
  }

  if (!isObject(parsed)) return null;
  if (Number(parsed.v) !== SHARE_SCHEMA_VERSION) return null;
  if (!isObject(parsed.scenario)) return null;

  const rawScenario = parsed.scenario;
  const scenarioId = typeof rawScenario.id === 'string' && rawScenario.id.trim() ? rawScenario.id.trim() : 'shared-tab';
  const scenarioName = typeof rawScenario.name === 'string' && rawScenario.name.trim() ? rawScenario.name.trim() : '공유 탭';

  const normalized = normalizePersistedAppState({
    portfolio: rawScenario.portfolio,
    investmentSettings: rawScenario.investmentSettings,
    scenarios: [
      {
        id: scenarioId,
        name: scenarioName,
        portfolio: rawScenario.portfolio,
        investmentSettings: rawScenario.investmentSettings
      }
    ],
    activeScenarioId: scenarioId
  });

  return normalized.scenarios[0] ?? null;
};

