// @vitest-environment node — 소스 스캔 + 순수 함수 (기준: vitest.config.ts)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANDING_COPY, LANDING_PAYOUT_RHYTHM_TICKERS } from '@/pages/Landing/copy';
import { RHYTHM_MONTHS, buildPayoutRhythmRows } from '@/pages/Landing/components';

/**
 * 랜딩의 **데이터·카피 규율**을 소스 수준에서 잠근다.
 *
 * 여기 있는 것들은 전부 "어겨도 앱이 잘 도는" 종류다 — 렌더 테스트로는 잡히지 않고, 리뷰가
 * 놓치는 순간 배포된다. 그리고 어느 것이든 어기면 **사용자에게 거짓말을 하게 된다.**
 */

const REPO_ROOT = process.cwd();
const LANDING_ROOT = join(REPO_ROOT, 'pages', 'Landing');

const listSourceFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
};

/** 서술적 주석이 그대로 매치되는 레포다 — 반드시 걷어내고 본다. */
const stripComments = (raw: string): string =>
  raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const landingSources = listSourceFiles(LANDING_ROOT).map((path) => ({
  path: relative(REPO_ROOT, path).split(sep).join('/'),
  code: stripComments(readFileSync(path, 'utf8'))
}));

describe('랜딩 데이터 규율', () => {
  /**
   * 🔴 이 네 필드는 엔진이 계산한 값이 아니라 **사람이 손으로 적은 큐레이션 문구**다
   * ("목표 월배당 약 40~50만원"). 로그인 없이 크롤러가 읽는 지면에 쓰면 근거 없는 수익 약속이 된다.
   * `coreType` 은 `allocations` 의 사본이라 어긋날 때 어느 쪽이 맞는지 알 수 없다.
   */
  it('프리셋의 큐레이션 금액·기간 필드를 랜딩이 읽지 않는다', () => {
    const forbidden = [
      'expectedMonthlyDividend',
      'monthlyInvestment',
      'targetInvestment',
      'investmentPeriod',
      'coreType',
      'buildPresetMetrics'
    ];

    const offenders = landingSources.flatMap(({ path, code }) =>
      forbidden.filter((field) => code.includes(field)).map((field) => `${path} → ${field}`)
    );

    expect(offenders).toEqual([]);
  });

  /**
   * 🔴 티커 서사 원본(`shared/constants/tickers`)은 서버 번들 실측 416KB 다.
   * 랜딩이 직접 읽으면 첫인상 지면이 그 무게를 진다 — 경량 인덱스가 존재하는 이유가 사라진다.
   */
  it('티커 서사 원본을 직접 import 하지 않는다', () => {
    const offenders = landingSources
      .filter(({ code }) => /from\s+'@\/shared\/constants\/tickers'/.test(code))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  /**
   * 🔴 지급 월은 월 1회 크론이 갱신한다. 카피에 "3·6·9·12월"이라고 적으면 다음 갱신에 조용히 거짓이 된다.
   * (같은 이유로 아래 리듬 테스트도 특정 월을 고정하지 않는다.)
   */
  it('카피에 지급 월을 박아 두지 않는다', () => {
    const copySource = readFileSync(join(LANDING_ROOT, 'copy', 'landingCopy.ts'), 'utf8');
    const strings = stripComments(copySource).match(/'[^']*'/g) ?? [];
    const offenders = strings.filter((text) => /\d+월\s*·\s*\d+월/.test(text));

    expect(offenders).toEqual([]);
  });

  /** 🔴 "눈덩이/스노우볼" 비유 전면 금지 — 예외 없음(구 "브랜드명 suffix 는 예외" 조항은 2026-08-03 폐기). */
  it('금지된 비유가 카피에 없다', () => {
    const flat = JSON.stringify(LANDING_COPY);

    expect(flat).not.toMatch(/눈덩이/);
    expect(flat).not.toMatch(/스노우볼/);
  });

  /**
   * 🔴 약속형 문장 금지. 특히 "받게 됩니다"는 이 지면에서 가장 나오기 쉬운 거짓말이다 —
   * FAQ 의 "계산 결과대로 배당을 받게 되나요?"는 **질문**이고 답이 "아니요"라서 예외로 둔다.
   */
  it('약속형 문장을 쓰지 않는다', () => {
    const promises = [
      ...LANDING_COPY.concept.items.map((item) => item.body),
      ...LANDING_COPY.compound.paragraphs,
      LANDING_COPY.payout.lede,
      LANDING_COPY.payout.honesty,
      LANDING_COPY.presets.lede,
      ...LANDING_COPY.checklist.steps,
      ...LANDING_COPY.checklist.cautions
      // ⚠ 부정형("수익을 보장하지 않으며")은 오히려 지켜야 할 문장이다 — 긍정형만 잡는다.
    ].filter((sentence) => /받게 됩니다|보장합니다|보장됩니다|수익이 납니다/.test(sentence));

    expect(promises).toEqual([]);
  });

  /** 🔴 외부 금융사 링크 0건 · 특정 증권사 언급 0건. */
  it('외부 링크와 특정 증권사 언급이 없다', () => {
    const flat = JSON.stringify(LANDING_COPY);

    expect(flat).not.toMatch(/https?:\/\//);
    expect(flat).not.toMatch(/증권사|키움|미래에셋|삼성증권|토스증권/);
  });
});

describe('랜딩 12칸 리듬 — 형태만 잠근다', () => {
  /**
   * 🔴 특정 월을 단정하지 마라. `payoutMonths` 는 월 1회 크론이 갱신하는 관측값이라,
   * "SCHD 는 3·6·9·12월"을 고정하면 다음 갱신에 이 테스트가 **틀린 이유로** 빨개진다.
   * 단정할 수 있는 것은 형태뿐이다.
   */
  it('칸은 12개이고, 채워지는 칸 수가 지급 월 수와 같다', () => {
    expect(RHYTHM_MONTHS).toHaveLength(12);

    for (const row of buildPayoutRhythmRows(LANDING_PAYOUT_RHYTHM_TICKERS)) {
      const filled = RHYTHM_MONTHS.filter((month) => row.months.includes(month));
      expect(filled).toHaveLength(row.months.length);
      expect(row.months.every((month) => month >= 1 && month <= 12)).toBe(true);
    }
  });

  it('스냅샷에 지급 월이 없는 종목은 사유를 밝힌다 — 임의로 월을 지어내지 않는다', () => {
    const [row] = buildPayoutRhythmRows(['정말없는티커']);

    expect(row.months).toEqual([]);
    expect(row.isUnknown).toBe(true);
  });
});
