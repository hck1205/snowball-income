import { GUIDES, GUIDE_START_PATH, type GuideContent, type GuideTable } from '@/shared/constants/guides';
import type { GuideLink, GuideTocItem, GuideViewModel } from './GuidePage.types';

/**
 * 한국어 성인의 대략적인 묵독 속도(분당 글자).
 *
 * ⚠ **정확한 값을 주장하지 않는다.** 화면에도 "약 N분"으로만 쓴다 — 이 숫자의 쓸모는 "이 글이
 *   두 문단인가 열 문단인가"를 착지 순간에 알려 주는 것이지 예측이 아니다.
 * 📝 500자/분은 한국어 묵독 연구에서 흔히 인용되는 대역(400~600)의 중앙이다.
 */
const CHARS_PER_MINUTE = 500;

/** 목차의 부록 항목 id — 본문 장 뒤에 붙는 두 자리. 화면·목차가 같은 값을 써야 앵커가 맞는다. */
export const FAQ_SECTION_ID = 'faq';
export const NEXT_SECTION_ID = 'next';

/** 표 한 벌이 품은 글자 수(캡션·머리·본문·전제). */
const tableChars = (table: GuideTable): number =>
  table.caption.length +
  table.columns.join('').length +
  table.rows.reduce((sum, row) => sum + row.join('').length, 0) +
  (table.note?.length ?? 0);

/**
 * 이 글을 읽는 데 걸리는 대략의 분(최소 1).
 *
 * 표와 FAQ 까지 센다 — 이 지면에서 표는 장식이 아니라 본문이고, FAQ 는 실제로 읽히는 분량이다.
 */
export const readingMinutes = (guide: GuideContent): number => {
  const bodyChars = guide.sections.reduce(
    (sum, section) =>
      sum +
      section.heading.length +
      section.paragraphs.join('').length +
      (section.table ? tableChars(section.table) : 0) +
      (section.caution?.length ?? 0),
    guide.lede.length
  );
  const faqChars = guide.faqs.reduce((sum, faq) => sum + faq.question.length + faq.answer.length, 0);

  return Math.max(1, Math.round((bodyChars + faqChars) / CHARS_PER_MINUTE));
};

/**
 * 이 열이 **수치 열**인가.
 *
 * 🔴 정렬·서체를 열 번호(첫 열이냐 아니냐)로 정하면 산문 표가 망가진다 — "항목 / 무엇을 보나"
 * 표의 설명 문장이 오른쪽 끝으로 밀려 등폭 숫자 서체로 렌더되던 것이 종전 조판이었다.
 *
 * 판정: 그 열의 **모든 본문 칸**이 숫자를 품고 있고, 짧아야(12자 이하) 한다. 한국어 단위(원·만·억·
 * 퍼센트·회)는 숫자와 함께 오므로 따로 허용할 필요가 없고, 길이 상한이 "약 3억 5,461만 원"(14자)
 * 같은 값은 통과시키고 "매수·매도할 때마다 붙는 비율. 소액을…" 같은 문장은 떨어뜨린다.
 */
const NUMERIC_CELL = /\d/;
const NUMERIC_CELL_MAX_LENGTH = 16;

export const isNumericColumn = (rows: readonly (readonly string[])[], columnIndex: number): boolean => {
  const cells = rows.map((row) => row[columnIndex] ?? '');
  if (cells.length === 0) return false;
  return cells.every((cell) => NUMERIC_CELL.test(cell) && cell.length <= NUMERIC_CELL_MAX_LENGTH);
};

/** 섹션 id → 열별 수치 여부. 표가 없는 섹션은 키를 만들지 않는다. */
const buildNumericColumns = (guide: GuideContent): Record<string, boolean[]> => {
  const result: Record<string, boolean[]> = {};
  for (const section of guide.sections) {
    const table = section.table;
    if (!table) continue;
    result[section.id] = table.columns.map((_, index) => isNumericColumn(table.rows, index));
  }
  return result;
};

/** 두 자리 장 번호. 목차와 본문 머리가 **같은 함수**를 쓴다(둘이 어긋나면 번호가 거짓말이 된다). */
export const chapterIndex = (order: number): string => String(order + 1).padStart(2, '0');

const toLink = (guide: GuideContent): GuideLink => {
  const step = GUIDE_START_PATH.findIndex((entry) => entry.slug === guide.slug);
  return {
    slug: guide.slug,
    title: guide.title,
    lede: guide.lede,
    ...(step >= 0 ? { step: step + 1 } : {})
  };
};

const buildToc = (guide: GuideContent): GuideTocItem[] => [
  ...guide.sections.map((section, order) => ({
    id: section.id,
    label: section.navLabel,
    index: chapterIndex(order)
  })),
  { id: FAQ_SECTION_ID, label: '자주 묻는 질문' },
  { id: NEXT_SECTION_ID, label: '다음 걸음' }
];

/**
 * 화면이 필요로 하는 모든 파생값을 한 번에 만든다.
 *
 * 🔴 뷰는 이 결과만 읽는다 — 조판이 데이터를 다시 뒤지기 시작하면 같은 계산이 여러 곳으로 흩어지고,
 * 그때부터 목차의 번호와 본문의 번호가 갈릴 수 있다.
 */
export const buildGuideViewModel = (guide: GuideContent): GuideViewModel => {
  const stepIndex = GUIDE_START_PATH.findIndex((entry) => entry.slug === guide.slug);
  const next = stepIndex >= 0 ? (GUIDE_START_PATH[stepIndex + 1] ?? null) : null;

  return {
    guide,
    toc: buildToc(guide),
    step: stepIndex >= 0 ? { current: stepIndex + 1, total: GUIDE_START_PATH.length } : null,
    readingMinutes: readingMinutes(guide),
    next: next ? toLink(next) : null,
    others: GUIDES.filter((entry) => entry.slug !== guide.slug && entry.slug !== next?.slug).map(toLink),
    numericColumns: buildNumericColumns(guide)
  };
};
