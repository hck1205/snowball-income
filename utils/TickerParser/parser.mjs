import { detectIssuer } from './issuerRules.mjs';

const normalizeHeader = (value) => value.trim().toLowerCase();

const toFieldMap = (headerLine) => {
  const headers = headerLine.split('|').map((header) => normalizeHeader(header));
  return headers.reduce((acc, header, index) => {
    acc[header] = index;
    return acc;
  }, {});
};

const getSymbolIndex = (fieldMap) => {
  if (typeof fieldMap.symbol === 'number') return fieldMap.symbol;
  if (typeof fieldMap['act symbol'] === 'number') return fieldMap['act symbol'];
  return -1;
};

const getSecurityNameIndex = (fieldMap) => {
  if (typeof fieldMap['security name'] === 'number') return fieldMap['security name'];
  return -1;
};

const getTestIssueIndex = (fieldMap) => {
  if (typeof fieldMap['test issue'] === 'number') return fieldMap['test issue'];
  return -1;
};

const getEtfIndex = (fieldMap) => {
  if (typeof fieldMap.etf === 'number') return fieldMap.etf;
  return -1;
};

/**
 * 두 원본의 공통 행 읽기. 테스트 종목·빈 행·꼬리줄(`File Creation Time`)은 여기서 걸러진다.
 * `isEtf` 는 원본의 `ETF` 열(Y/N) 그대로다 — 열이 없는 형식이면 `false`.
 */
const readRows = (rawText) => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('Input TXT has no data lines.');
  }

  const fieldMap = toFieldMap(lines[0]);
  const symbolIndex = getSymbolIndex(fieldMap);
  const securityNameIndex = getSecurityNameIndex(fieldMap);
  const testIssueIndex = getTestIssueIndex(fieldMap);
  const etfIndex = getEtfIndex(fieldMap);

  if (symbolIndex < 0 || securityNameIndex < 0) {
    throw new Error('Unsupported TXT format. Required columns: Symbol/ACT Symbol and Security Name.');
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes('|')) continue;
    if (line.toLowerCase().startsWith('file creation time')) continue;

    const fields = line.split('|');
    const ticker = (fields[symbolIndex] ?? '').trim().toUpperCase();
    const securityName = (fields[securityNameIndex] ?? '').trim();
    const testIssue = testIssueIndex >= 0 ? (fields[testIssueIndex] ?? '').trim().toUpperCase() : '';
    const isEtf = etfIndex >= 0 && (fields[etfIndex] ?? '').trim().toUpperCase() === 'Y';

    if (!ticker || !securityName) continue;
    if (testIssue === 'Y') continue;

    rows.push({ ticker, securityName, isEtf });
  }
  return rows;
};

/**
 * 원본에서 **ETF 로 표시된 행만** `{ 티커: 종목명 }` 으로 뽑는다(ETF 겹침 화면의 검색 목록).
 *
 * 🔴 `parseNasdaqLikeTxt` 의 출력에 플래그를 끼우지 않고 따로 뽑는 이유: 그 출력은 시뮬레이터의
 *    티커 모달이 번들에 통째로 싣는다. 수천 행에 필드 하나씩 더하면 첫 화면 번들이 그만큼 커진다.
 */
export const pickEtfTickers = (rawText) => {
  const output = {};
  for (const row of readRows(rawText)) {
    if (row.isEtf) output[row.ticker] = row.securityName;
  }
  return output;
};

export const parseNasdaqLikeTxt = (rawText) => {
  const output = {};
  for (const row of readRows(rawText)) {
    output[row.ticker] = {
      name: row.securityName,
      issuer: detectIssuer(row.securityName)
    };
  }
  return output;
};
