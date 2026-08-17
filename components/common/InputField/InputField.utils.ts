export const toInputId = (label: string): string => label.replace(/\s+/g, '-').toLowerCase();

const numberFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 20
});

export const formatNumericDisplay = (value: string | number): string => {
  if (value === '') return '';

  const raw = String(value).replace(/,/g, '');

  if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return raw;

  /*
   * 소수부는 **비어 있을 수 있다**(`"1234."`). 입력 중간 상태이고, 예전 패턴(`\.\d+`)은 그것을
   * 숫자로 보지 않아 원문을 그대로 돌려줬다 — 그래서 소수점을 찍는 한 타에만 천단위 구분이
   * 사라졌다가(`1234.`) 다음 숫자에서 되돌아오는(`1,234.5`) 깜빡임이 있었다.
   */
  if (!/^-?\d*(\.\d*)?$/.test(raw)) return raw;

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
