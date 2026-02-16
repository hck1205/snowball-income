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

export const parseNasdaqLikeTxt = (rawText) => {
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

  if (symbolIndex < 0 || securityNameIndex < 0) {
    throw new Error('Unsupported TXT format. Required columns: Symbol/ACT Symbol and Security Name.');
  }

  const output = {};
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes('|')) continue;
    if (line.toLowerCase().startsWith('file creation time')) continue;

    const fields = line.split('|');
    const ticker = (fields[symbolIndex] ?? '').trim().toUpperCase();
    const securityName = (fields[securityNameIndex] ?? '').trim();
    const testIssue = testIssueIndex >= 0 ? (fields[testIssueIndex] ?? '').trim().toUpperCase() : '';

    if (!ticker || !securityName) continue;
    if (testIssue === 'Y') continue;

    output[ticker] = {
      name: securityName,
      issuer: detectIssuer(securityName)
    };
  }

  return output;
};
