export const toInputId = (label: string): string => label.replace(/\s+/g, '-').toLowerCase();

const numberFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 20
});

export const formatNumericDisplay = (value: string | number): string => {
  if (value === '') return '';

  const raw = String(value).replace(/,/g, '');

  if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return raw;

  if (!/^-?\d*(\.\d+)?$/.test(raw)) return raw;

  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const [integerPart, decimalPart] = unsigned.split('.');

  const formattedInteger = numberFormatter.format(Number(integerPart || 0));
  const decimalSuffix = decimalPart !== undefined ? `.${decimalPart}` : '';
  const signPrefix = isNegative ? '-' : '';

  return `${signPrefix}${formattedInteger}${decimalSuffix}`;
};

export const normalizeNumericInput = (value: string): string => {
  const raw = value.replace(/,/g, '').trim();
  let normalized = '';
  let hasMinus = false;
  let hasDot = false;

  for (const char of raw) {
    if (char >= '0' && char <= '9') {
      normalized += char;
      continue;
    }

    if (char === '-' && !hasMinus && normalized.length === 0) {
      hasMinus = true;
      normalized += char;
      continue;
    }

    if (char === '.' && !hasDot) {
      hasDot = true;
      normalized += char;
    }
  }

  return normalized;
};
