/**
 * 대가 보유 스냅샷 수집기.
 *
 * ```sh
 * npx vite-node scripts/investorHoldings/cli.ts -- --check      # 변경 여부만 본다(요청 13건)
 * npx vite-node scripts/investorHoldings/cli.ts                 # 변경분만 받아 스냅샷 갱신
 * npx vite-node scripts/investorHoldings/cli.ts -- --force      # 전원 재수집(파서를 고쳤을 때)
 * ```
 *
 * ## 🔴 설계 한 줄: **"매일 확인하고, 바뀔 때만 갱신한다."**
 * 13F 는 분기 데이터다. 매일 재수집하면 **같은 내용으로 360번 커밋**한다. 접수번호를 비교해
 * 달라진 인물만 받는다 — 그래서 평소 요청이 13건이고, 실제 갱신은 연 4회 마감 주간에 몰린다.
 *
 * ## 🔴 실패해도 기존 스냅샷을 망가뜨리지 않는다
 * 한 명이 실패해도 전체를 실패로 만들지 않는다(그 사람의 **직전 값을 그대로 유지**한다).
 * 그리고 **파싱 결과가 0종목이면 덮어쓰지 않는다** — 빈 데이터로 화면을 비우는 것이 최악이다.
 * 스킵·실패는 전부 리포트로 남긴다(조용한 성공 위장 금지 — `tickerRefresh` 와 같은 규율).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INVESTORS } from './roster';
import { parse13fInfoTable, topHoldings, weightPercent } from './parse13f';
import { SecClient } from './sec';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SNAPSHOT_PATH = resolve(ROOT, 'shared/constants/investors/investorHoldings.generated.json');

/**
 * 인물당 저장할 보유 종목 수.
 *
 * 켄 피셔는 1,016종, 데일리 저널은 4종이다. 전부 저장하면 스냅샷이 수 MB 가 되고 그게 **엔트리 번들에
 * 들어갈 위험**이 있다(프리셋이 이미 그렇다 — decisions.md 2026-08-02). 화면이 보여줄 수 있는 것도
 * 상위 일부다. 전체 종목 수는 `totalHoldingCount` 로 따로 남겨 "전체 N종 중 상위 M종"을 말할 수 있게 한다.
 */
const TOP_N = 25;

type StoredHolding = { cusip: string; issuer: string; valueUsd: number; weightPercent: number | null };
type StoredInvestor = {
  cik: string;
  person: string;
  firm: string;
  note: string;
  registrantName: string;
  accessionNumber: string;
  reportDate: string;
  filingDate: string;
  valueUnit: 'dollars' | 'thousands';
  totalValueUsd: number;
  totalHoldingCount: number;
  topHoldings: StoredHolding[];
};
type Snapshot = { generatedAt: string; source: string; investors: StoredInvestor[] };

const readSnapshot = (): Snapshot | null => {
  try {
    return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8')) as Snapshot;
  } catch {
    return null;
  }
};

const args = process.argv.slice(2);
const isCheckOnly = args.includes('--check');
const isForce = args.includes('--force');

const previous = readSnapshot();
const previousByCik = new Map((previous?.investors ?? []).map((entry) => [entry.cik, entry]));

const client = new SecClient();
const next: StoredInvestor[] = [];
const changed: string[] = [];
const skipped: string[] = [];
const failed: string[] = [];

for (const investor of INVESTORS) {
  const prior = previousByCik.get(investor.cik);
  try {
    const latest = await client.findLatest13F(investor.cik);
    if (!latest) {
      failed.push(`${investor.person}: 13F 공시를 찾지 못했다(명단의 CIK 를 확인하라)`);
      if (prior) next.push(prior);
      continue;
    }

    /* 같은 접수번호면 내용이 같다 — 받지 않는다. 이 한 줄이 하루 26건의 요청을 없앤다. */
    if (!isForce && prior && prior.accessionNumber === latest.accessionNumber) {
      next.push(prior);
      continue;
    }

    if (isCheckOnly) {
      changed.push(`${investor.person}: ${prior?.reportDate ?? '(없음)'} → ${latest.reportDate}`);
      if (prior) next.push(prior);
      continue;
    }

    const xml = await client.fetchInfoTableXml(investor.cik, latest.accessionNumber);
    if (!xml) {
      failed.push(`${investor.person}: 정보표 XML 이 없다(기밀 취급 요청일 수 있다)`);
      if (prior) next.push(prior);
      continue;
    }

    const parsed = parse13fInfoTable(xml);
    /* 🔴 0종목이면 덮어쓰지 않는다 — 파서가 조용히 죽은 것과 진짜 무보유를 구분할 수 없다. */
    if (parsed.holdings.length === 0) {
      failed.push(`${investor.person}: 파싱 결과 0종목 — 기존 값을 유지한다`);
      if (prior) next.push(prior);
      continue;
    }

    next.push({
      cik: investor.cik,
      person: investor.person,
      firm: investor.firm,
      note: investor.note,
      registrantName: latest.registrantName,
      accessionNumber: latest.accessionNumber,
      reportDate: latest.reportDate,
      filingDate: latest.filingDate,
      valueUnit: parsed.valueUnit,
      totalValueUsd: parsed.totalValueUsd,
      totalHoldingCount: parsed.holdings.length,
      topHoldings: topHoldings(parsed, TOP_N).map((holding) => ({
        cusip: holding.cusip,
        issuer: holding.issuer,
        valueUsd: holding.valueUsd,
        weightPercent: weightPercent(holding, parsed)
      }))
    });

    changed.push(
      `${investor.person}: ${latest.reportDate} · ${parsed.holdings.length}종 · ` +
        `$${(parsed.totalValueUsd / 1e9).toFixed(1)}B${parsed.valueUnit === 'thousands' ? ' [천단위 보정]' : ''}`
    );
  } catch (error) {
    failed.push(`${investor.person}: ${String(error instanceof Error ? error.message : error).slice(0, 120)}`);
    if (prior) next.push(prior);
  }
}

/* ── 리포트 — 스킵과 실패를 반드시 드러낸다 ──────────────────────────────────── */

console.log(`\n[investorHoldings] ${isCheckOnly ? '확인만' : isForce ? '전원 재수집' : '변경분 갱신'}`);
console.log(`  대상 ${INVESTORS.length}명 · 변경 ${changed.length} · 유지 ${next.length - changed.length} · 실패 ${failed.length}`);
for (const line of changed) console.log(`  ✓ ${line}`);
for (const line of skipped) console.log(`  – ${line}`);
for (const line of failed) console.error(`  ✗ ${line}`);

if (isCheckOnly) {
  console.log(changed.length > 0 ? '\n  새 공시가 있다 — --check 없이 다시 실행하라.' : '\n  새 공시 없음.');
  process.exit(0);
}

if (changed.length === 0) {
  console.log('\n  변경 없음 — 스냅샷을 쓰지 않는다(같은 내용으로 커밋하지 않기 위해).');
  process.exit(0);
}

mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
writeFileSync(
  SNAPSHOT_PATH,
  `${JSON.stringify(
    {
      /* 사람이 바로 읽을 수 있게 날짜만 남긴다. 시각까지 넣으면 내용이 같아도 diff 가 생긴다. */
      generatedAt: new Date().toISOString().slice(0, 10),
      source: 'SEC EDGAR 13F-HR',
      investors: next
    } satisfies Snapshot,
    null,
    2
  )}\n`,
  'utf-8'
);

console.log(`\n  스냅샷 갱신: ${SNAPSHOT_PATH.replace(ROOT, '.')}`);
if (failed.length > 0) process.exitCode = 1;
