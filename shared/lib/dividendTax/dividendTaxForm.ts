import type { HealthInsuranceStatus, PensionAgeBand } from './dividendTax';

/**
 * 세금 계산기 조건 ↔ 주소 쿼리(2026-11-13, 결과 공유). 링크를 받은 사람이 **보낸 사람이 본 결과 그대로** 연다.
 * 다른 지면이 세금 계산기를 미리 채워 여는 링크(은퇴 후 월 소득 → "이 조건으로 세금 보기")도 이 함수로 만든다 —
 * 주소 형식의 정본은 여기 한 곳이다(2026-11-13 페이지 폴더에서 옮겨 왔다).
 *
 * 🔴 이 쿼리는 공유 링크로 밖에 나간다 — 한 번 나간 링크는 계속 열려야 한다. 키 이름(`m`·`h`·`of`·`ot`·`od`·
 * `isa`·`pa`)을 바꾸지 마라. 새 칸은 새 키로 더하고, 모르는 키·잘못된 값은 기본값으로 둔다(열리지 않는 링크 0).
 * 정규 주소(canonical)는 쿼리 없는 `/dividend/tax` 그대로다 — 검색엔진에 조건별 사본이 생기지 않는다.
 */
export type DividendTaxForm = {
  /** 미국 월 배당(세전, 만원) — 입력창 문자열 그대로. */
  readonly monthlyUs: string;
  readonly otherFinancial: string;
  readonly otherTaxBase: string;
  readonly health: HealthInsuranceStatus;
  readonly otherIncomeForDependent: string;
  readonly isaSeomin: boolean;
  /** 연금계좌 비교의 연금 받는 나이(2026-11-13, 키 `pa`). */
  readonly pensionAge: PensionAgeBand;
};

export const DEFAULT_DIVIDEND_TAX_FORM: DividendTaxForm = {
  monthlyUs: '150',
  otherFinancial: '0',
  otherTaxBase: '0',
  health: 'regional',
  otherIncomeForDependent: '0',
  isaSeomin: false,
  pensionAge: 'under70'
};

const HEALTH_VALUES: readonly HealthInsuranceStatus[] = ['employee', 'regional', 'dependent'];
const PENSION_AGE_VALUES: readonly PensionAgeBand[] = ['under70', 'from70', 'from80'];
/** 만원 단위 상한(1조원) — 그 위는 오타로 보고 버린다. 주소 길이도 묶인다. */
const MAX_MAN = 100_000_000;

/** 만원 금액 문자열 — 0 이상의 유한수(소수 둘째 자리까지)만. 아니면 null. */
const parseMan = (raw: string | null): string | null => {
  if (raw === null || !/^\d{1,9}(\.\d{1,2})?$/.test(raw)) return null;
  const value = Number(raw);
  return value <= MAX_MAN ? String(value) : null;
};

/** 주소 쿼리 → 계산 조건. 없는 키·잘못된 값은 기본값. */
export const formFromSearch = (search: string): DividendTaxForm => {
  const params = new URLSearchParams(search);
  const health = params.get('h');
  return {
    monthlyUs: parseMan(params.get('m')) ?? DEFAULT_DIVIDEND_TAX_FORM.monthlyUs,
    otherFinancial: parseMan(params.get('of')) ?? DEFAULT_DIVIDEND_TAX_FORM.otherFinancial,
    otherTaxBase: parseMan(params.get('ot')) ?? DEFAULT_DIVIDEND_TAX_FORM.otherTaxBase,
    health: HEALTH_VALUES.includes(health as HealthInsuranceStatus)
      ? (health as HealthInsuranceStatus)
      : DEFAULT_DIVIDEND_TAX_FORM.health,
    otherIncomeForDependent: parseMan(params.get('od')) ?? DEFAULT_DIVIDEND_TAX_FORM.otherIncomeForDependent,
    isaSeomin: params.get('isa') === '1',
    pensionAge: PENSION_AGE_VALUES.includes(params.get('pa') as PensionAgeBand)
      ? (params.get('pa') as PensionAgeBand)
      : DEFAULT_DIVIDEND_TAX_FORM.pensionAge
  };
};

/**
 * 계산 조건 → 주소 쿼리(`?` 포함). 월 배당·자격은 늘 싣고, 나머지는 0·꺼짐이면 뺀다(링크가 짧다).
 * 피부양자가 아니면 피부양자 전용 칸(`od`)은 싣지 않는다 — 화면에 없는 값이 결과를 바꾸지 않는다.
 */
export const formToSearch = (form: DividendTaxForm): string => {
  const params = new URLSearchParams();
  params.set('m', parseMan(form.monthlyUs.replace(/,/g, '')) ?? '0');
  params.set('h', form.health);
  const optional: [string, string][] = [
    ['of', form.otherFinancial],
    ['ot', form.otherTaxBase],
    ...(form.health === 'dependent' ? ([['od', form.otherIncomeForDependent]] as [string, string][]) : [])
  ];
  for (const [key, raw] of optional) {
    const value = parseMan(raw.replace(/,/g, ''));
    if (value && value !== '0') params.set(key, value);
  }
  if (form.isaSeomin) params.set('isa', '1');
  if (form.pensionAge !== DEFAULT_DIVIDEND_TAX_FORM.pensionAge) params.set('pa', form.pensionAge);
  return `?${params.toString()}`;
};
