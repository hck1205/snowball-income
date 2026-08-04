/**
 * 국민연금 미국 주식 보유 스냅샷 수집기.
 *
 * ```sh
 * npm run nps:portfolio             # 최신 13F + 직전 분기를 받아 스냅샷 갱신
 * npm run nps:portfolio -- --check  # 새 공시가 있는지만 본다(요청 1건)
 * ```
 *
 * ## 🔴 국민연금이 왜 미국 공시에 나오는가
 * 미국 주식을 1억 달러 넘게 굴리는 기관은 국적과 무관하게 SEC 에 **13F** 를 낸다. 국민연금공단은
 * `National Pension Service`(CIK 0001608046, 전주 소재)로 등록돼 분기마다 제출한다 —
 * 즉 **국민연금의 미국 주식 포트폴리오는 미국 정부가 공개하는 공식 자료**다. 국내 주식은 여기 없다.
 *
 * ## 🔴 이 화면이 반드시 말해야 하는 것
 * 1. **미국 상장 주식만이다.** 국민연금 전체 기금(1,000조 원대) 중 일부다. 국내 주식·채권·대체투자·
 *    현금은 이 자료에 **전혀** 없다. 비중은 "13F 신고분 안에서의 비중"이지 기금 비중이 아니다.
 * 2. **최대 45일 늦다.** 분기말 기준이고 제출 기한이 45일이다.
 * 3. **롱 포지션만이다.** 공매도는 신고 대상이 아니다.
 *
 * ## 직전 분기와 비교하는 이유
 * "무엇을 들고 있나"보다 "무엇을 새로 샀고 무엇을 접었나"가 훨씬 읽을 값이 크다. 13F 두 장이면
 * 그 차이를 정확히 낼 수 있다(같은 CUSIP 의 금액 비교) — 그래서 **두 분기를 받는다.**
 * ⚠ 금액 변화는 **주가 변동을 포함한다.** 수량 변화가 아니다 — 화면이 그 사실을 말해야 한다.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse13fInfoTable, weightPercent } from '../investorHoldings/parse13f';
import type { Parsed13F } from '../investorHoldings/parse13f';
import { SecClient } from '../investorHoldings/sec';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SNAPSHOT_PATH = resolve(ROOT, 'shared/constants/npsPortfolio/npsPortfolio.generated.json');

/** 국민연금공단의 SEC 등록 CIK. 🔴 이름으로 검색하지 마라 — 동명 법인이 뜬다(로스터 주석의 실측). */
const NPS_CIK = '0001608046';

/**
 * 저장할 보유 종목 수.
 *
 * 국민연금의 신고분은 수백 종이다. 전부 저장하면 스냅샷이 MB 단위가 되고 그게 lazy 청크에 실린다.
 * 화면이 보여줄 수 있는 것도 상위 일부다 — 전체 종목 수는 따로 남겨 "전체 N종 중 상위 M종"을 말한다.
 */
const TOP_N = 50;
/** 변동(신규·청산) 목록의 길이. 양쪽 각각. */
const MOVE_N = 12;

type StoredHolding = {
  cusip: string;
  issuer: string;
  valueUsd: number;
  weightPercent: number | null;
  /** 직전 분기 대비 신고 금액 변화율(%). 직전 자료가 없거나 신규면 `null`. */
  changePercent: number | null;
  /** 직전 분기에 없던 종목인가. */
  isNew: boolean;
};

type StoredMove = { cusip: string; issuer: string; valueUsd: number };

type Snapshot = {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  cik: string;
  registrantName: string;
  accessionNumber: string;
  reportDate: string;
  filingDate: string;
  /** 직전 분기 기준일. 비교가 불가능하면 `null`. */
  previousReportDate: string | null;
  totalValueUsd: number;
  previousTotalValueUsd: number | null;
  totalHoldingCount: number;
  previousHoldingCount: number | null;
  topHoldings: StoredHolding[];
  /** 이번 분기에 새로 등장한 종목(금액 큰 순). */
  opened: StoredMove[];
  /** 직전 분기에 있다가 사라진 종목(직전 금액 큰 순). */
  closed: StoredMove[];
};

const readSnapshot = (): Snapshot | null => {
  try {
    return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8')) as Snapshot;
  } catch {
    return null;
  }
};

const isCheckOnly = process.argv.slice(2).includes('--check');

const client = new SecClient();

const filings = await client.findLatestTwo13F(NPS_CIK);
if (filings.length === 0) {
  console.error('✗ 13F 공시를 찾지 못했다 — CIK 를 확인하라.');
  process.exit(1);
}

const [latest, previous] = filings;
const stored = readSnapshot();

if (stored && stored.accessionNumber === latest.accessionNumber) {
  console.log(`[nps] 새 공시 없음 (${latest.reportDate} · ${latest.accessionNumber}).`);
  process.exit(0);
}

if (isCheckOnly) {
  console.log(`[nps] 새 공시가 있다: ${stored?.reportDate ?? '(없음)'} → ${latest.reportDate}`);
  process.exit(0);
}

const fetchParsed = async (accessionNumber: string): Promise<Parsed13F | null> => {
  const xml = await client.fetchInfoTableXml(NPS_CIK, accessionNumber);
  if (!xml) return null;
  const parsed = parse13fInfoTable(xml);
  return parsed.holdings.length > 0 ? parsed : null;
};

const current = await fetchParsed(latest.accessionNumber);
if (!current) {
  /* 🔴 0종목이면 덮어쓰지 않는다 — 파서가 조용히 죽은 것과 진짜 무보유를 구분할 수 없다. */
  console.error('✗ 최신 공시의 정보표가 비었다 — 기존 스냅샷을 유지한다.');
  process.exit(1);
}

const prior = previous ? await fetchParsed(previous.accessionNumber) : null;
const priorByCusip = new Map((prior?.holdings ?? []).map((holding) => [holding.cusip, holding]));
const currentByCusip = new Map(current.holdings.map((holding) => [holding.cusip, holding]));

/* 🔴 주식만 남긴다. 국민연금 신고분에 옵션이 섞이면 명목 금액이 비중을 왜곡한다(버리 사례와 같은 함정). */
const shares = current.holdings.filter((holding) => holding.kind === 'share');

const topHoldings: StoredHolding[] = [...shares]
  .sort((left, right) => right.valueUsd - left.valueUsd)
  .slice(0, TOP_N)
  .map((holding) => {
    const before = priorByCusip.get(holding.cusip);
    return {
      cusip: holding.cusip,
      issuer: holding.issuer,
      valueUsd: holding.valueUsd,
      weightPercent: weightPercent(holding, current),
      /* ⚠ 금액 변화다 — 주가가 오르면 한 주도 안 사도 늘어난다. 수량 변화가 아니다. */
      changePercent:
        before && before.valueUsd > 0 ? ((holding.valueUsd - before.valueUsd) / before.valueUsd) * 100 : null,
      isNew: prior !== null && !before
    };
  });

const opened: StoredMove[] = prior
  ? shares
      .filter((holding) => !priorByCusip.has(holding.cusip))
      .sort((left, right) => right.valueUsd - left.valueUsd)
      .slice(0, MOVE_N)
      .map(({ cusip, issuer, valueUsd }) => ({ cusip, issuer, valueUsd }))
  : [];

const closed: StoredMove[] = prior
  ? prior.holdings
      .filter((holding) => holding.kind === 'share' && !currentByCusip.has(holding.cusip))
      .sort((left, right) => right.valueUsd - left.valueUsd)
      .slice(0, MOVE_N)
      .map(({ cusip, issuer, valueUsd }) => ({ cusip, issuer, valueUsd }))
  : [];

const snapshot: Snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'SEC EDGAR 13F-HR — National Pension Service',
  sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${NPS_CIK}&type=13F`,
  cik: NPS_CIK,
  registrantName: latest.registrantName,
  accessionNumber: latest.accessionNumber,
  reportDate: latest.reportDate,
  filingDate: latest.filingDate,
  previousReportDate: prior ? (previous?.reportDate ?? null) : null,
  totalValueUsd: current.totalValueUsd,
  previousTotalValueUsd: prior ? prior.totalValueUsd : null,
  totalHoldingCount: current.holdings.length,
  previousHoldingCount: prior ? prior.holdings.length : null,
  topHoldings,
  opened,
  closed
};

mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');

console.log(
  `\n✓ ${SNAPSHOT_PATH.replace(ROOT, '.')}\n` +
    `  ${latest.reportDate} 기준 · ${current.holdings.length}종 · $${(current.totalValueUsd / 1e9).toFixed(1)}B\n` +
    `  직전 ${previous?.reportDate ?? '(없음)'} · 신규 ${opened.length} · 청산 ${closed.length}` +
    (prior ? '' : '  ⚠ 직전 분기를 못 읽어 변동 비교를 넣지 않았다')
);
