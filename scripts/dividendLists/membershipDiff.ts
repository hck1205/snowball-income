import { ListSourceError } from './sources';

/**
 * 후보 유니버스 생성물의 **구성 변화 감지**. 월간 크론(`.github/workflows/refresh-dividend-universe.yml`)이
 * "자동으로 머지해도 되는 갱신인가"를 이 모듈의 판정으로 결정한다.
 *
 * ## 🔴 왜 필드 변화와 구성 변화를 갈라야 하나
 * 배당률·성장률·섹터가 바뀐 것은 **가격이 움직였다는 뜻**이다 — 매달 반드시 일어나고, 사람이 볼 것이 없다.
 * 반면 종목이 **빠지는** 것은 그 종목이 배당을 삭감했거나 지수에서 탈락했다는 뜻이다. 이 레포가 목록을
 * DB 가 아니라 **커밋되는 JSON** 에 둔 이유가 정확히 그것이다 — 구성 변화는 git 이력에 남고 사람이 승인한다.
 * 그래서 여기서 나오는 판정은 하나뿐이다: **자동 머지를 막을 것인가.**
 *
 * ## 판정 규칙
 * | 신호 | 자동 머지 |
 * |---|---|
 * | 배당률·성장률·섹터·이름만 바뀜 | ✅ 통과 |
 * | 종목이 추가·삭제됨 | ❌ 막는다 (지수 편출입·배당 삭감의 결과다) |
 * | 종목은 그대로인데 **편입 ETF 가 바뀜** | ❌ 막는다 (NOBL 에서 빠지고 SDY 만 남는 것 = 배당귀족 탈락) |
 * | **새로운 막는 신고**가 생김 | ❌ 막는다 (streakContradiction = 연속증배 종목의 삭감) |
 * | 비교 기준(직전 커밋본)이 아예 없음 | ❌ 막는다 (첫 도입 커밋을 크론이 혼자 머지하면 안 된다) |
 *
 * ⚠ **이미 알려진 막는 신고는 막지 않는다.** 2026-08-04 실측 기준 5건(FCPT·STAG·RLI·WRB·MBGL)이
 * 상시로 떠 있다 — 신고 존재 자체로 막으면 자동 머지 경로가 영원히 죽는다. 그래서 기준본에 없던
 * `(티커, 종류)` 조합만 새 신고로 센다.
 *
 * IO 는 하지 않는다(파일 읽기·GITHUB_OUTPUT 쓰기는 `membershipDiffCli.ts`). 그래야 실제로 크론을
 * 돌리지 않고도 판정 규칙을 고정 입력으로 테스트할 수 있다.
 */

/* ────────────────────────────── 읽기 ────────────────────────────── */

/** 비교에 필요한 최소 형태. 🔴 기준본은 **과거 스키마**일 수 있으므로 관대하게 읽는다. */
export type UniverseMemberView = {
  ticker: string;
  name: string;
  sourceEtfs: string[];
  hasMetrics: boolean;
};

export type UniverseBlockingIssueView = {
  ticker: string;
  kind: string;
  detail: string;
};

export type UniverseMembershipView = {
  asOf: string | null;
  members: UniverseMemberView[];
  blockingIssues: UniverseBlockingIssueView[];
  /** `fetchFailed` 신고 수. 야후가 러너 IP 를 막았는지 판단하는 근거다. */
  fetchFailedCount: number;
  coverage: { total: number; withMetrics: number; withSector: number; withGrowth: number } | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/**
 * 스냅샷 JSON → 비교용 형태.
 *
 * 🔴 여기서 zod 스키마(`dividendUniverseSnapshotSchema`)를 쓰지 않는다. 기준본은 **몇 달 전 스키마로
 * 쓰인 파일**이고, 필드가 하나 늘었다는 이유로 비교가 실패하면 크론은 "비교 못 했다"를 "구성이 바뀌었다"로
 * 오인해 매달 사람을 부른다. 비교에 실제로 필요한 것은 티커·편입 ETF·막는 신고뿐이므로 그것만 요구한다.
 * (쓰기 직전 형태 검증은 `universeCli.ts` 가 이미 zod 로 한다 — 방벽이 두 겹이지 한 겹이 아니다.)
 */
export const readUniverseMembership = (raw: unknown, label: string): UniverseMembershipView => {
  if (!isRecord(raw)) throw new ListSourceError(`${label}: 유니버스 스냅샷이 객체가 아니다.`);
  const entries = raw.entries;
  if (!Array.isArray(entries)) throw new ListSourceError(`${label}: entries 배열이 없다.`);

  const members: UniverseMemberView[] = [];
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.ticker !== 'string' || entry.ticker.length === 0) {
      throw new ListSourceError(`${label}: ticker 가 없는 항목이 있다.`);
    }
    members.push({
      ticker: entry.ticker,
      name: typeof entry.name === 'string' ? entry.name : entry.ticker,
      sourceEtfs: asStringArray(entry.sourceEtfs),
      hasMetrics: isRecord(entry.metrics)
    });
  }

  const blockingIssues: UniverseBlockingIssueView[] = [];
  let fetchFailedCount = 0;
  const issues = Array.isArray(raw.issues) ? raw.issues : [];
  for (const issue of issues) {
    if (!isRecord(issue) || typeof issue.ticker !== 'string' || typeof issue.kind !== 'string') continue;
    if (issue.kind === 'fetchFailed') fetchFailedCount += 1;
    if (issue.blocking !== true) continue;
    blockingIssues.push({
      ticker: issue.ticker,
      kind: issue.kind,
      detail: typeof issue.detail === 'string' ? issue.detail : ''
    });
  }

  const coverage = isRecord(raw.coverage)
    ? {
        total: Number(raw.coverage.total ?? members.length),
        withMetrics: Number(raw.coverage.withMetrics ?? 0),
        withSector: Number(raw.coverage.withSector ?? 0),
        withGrowth: Number(raw.coverage.withGrowth ?? 0)
      }
    : null;

  return {
    asOf: typeof raw.asOf === 'string' ? raw.asOf : null,
    members,
    blockingIssues,
    fetchFailedCount,
    coverage
  };
};

/* ────────────────────────────── 수집 건강도 ────────────────────────────── */

/**
 * 대량 조회 실패로 판정하는 비율. 🔴 이 가드가 없으면 **야후가 러너 IP 를 막은 날 사고가 난다**:
 * 수집 루프는 종목 하나의 실패를 던지지 않고 `fetchFailed` 로 접기 때문에(설계상 옳다 — 한 종목 때문에
 * 260종을 잃지 않는다), 전부 실패해도 파일은 정상적으로 쓰이고 262종의 `metrics` 가 전부 `null` 이 된다.
 * 구성(티커 집합)은 그대로라 멤버십 감지도 통과한다 — 즉 **실측치를 전부 지운 커밋이 자동 머지된다**.
 * 그래서 커밋 전에 실패율을 따로 본다. 10%는 개별 종목의 일시 오류(1~2종)는 넘기고 전면 차단은 잡는 선이다.
 */
export const HEALTH_MAX_FETCH_FAILED_RATIO = 0.1;

export type CollectionHealth = {
  ok: boolean;
  fetchFailedCount: number;
  total: number;
  ratio: number;
  detail: string;
};

export const assessCollectionHealth = (
  head: UniverseMembershipView,
  maxRatio: number = HEALTH_MAX_FETCH_FAILED_RATIO
): CollectionHealth => {
  const total = head.members.length;
  const ratio = total === 0 ? 1 : head.fetchFailedCount / total;
  const ok = total > 0 && ratio <= maxRatio;
  return {
    ok,
    fetchFailedCount: head.fetchFailedCount,
    total,
    ratio,
    detail: ok
      ? `조회 실패 ${head.fetchFailedCount}/${total}종 (허용 ${(maxRatio * 100).toFixed(0)}% 이내)`
      : total === 0
        ? '수집된 종목이 0종이다 — 소스 파싱이 통째로 깨졌다.'
        : `조회 실패 ${head.fetchFailedCount}/${total}종 (${(ratio * 100).toFixed(1)}%) — ` +
          '야후가 러너 IP 를 막았을 가능성이 높다. 이대로 커밋하면 실측치가 지워진다.'
  };
};

/* ────────────────────────────── 비교 ────────────────────────────── */

export type EtfMembershipChange = {
  ticker: string;
  name: string;
  /** 새로 편입된 ETF. */
  joined: string[];
  /** 빠진 ETF. 🔴 여기가 "지수 탈락"이 보이는 자리다. */
  left: string[];
};

export type UniverseMembershipDiff = {
  /** 비교 기준본이 아예 없었다(첫 도입 커밋). */
  baselineMissing: boolean;
  addedTickers: UniverseMemberView[];
  removedTickers: UniverseMemberView[];
  etfChanges: EtfMembershipChange[];
  /** 기준본에 없던 `(티커, 종류)` 조합의 막는 신고. */
  newBlockingIssues: UniverseBlockingIssueView[];
  /** 기준본에는 있었지만 이번에 사라진 막는 신고(사람이 처리했거나 저절로 풀렸다). */
  clearedBlockingIssues: UniverseBlockingIssueView[];
  /** 종목 집합 또는 편입 ETF 가 바뀌었다. */
  membershipChanged: boolean;
  /** 🔴 자동 머지를 막아야 하는가. 워크플로가 보는 최종 값이다. */
  blocked: boolean;
  blockReasons: string[];
  counts: { base: number; head: number };
};

const byTicker = <T extends { ticker: string }>(left: T, right: T): number =>
  left.ticker.localeCompare(right.ticker);

const issueKey = (issue: UniverseBlockingIssueView): string => `${issue.ticker}|${issue.kind}`;

/**
 * 기준본과 이번 수집본을 비교해 **자동 머지 여부**를 판정한다.
 *
 * `base` 가 `null` 이면 비교 기준이 없다는 뜻이고, 그때는 통과가 아니라 **차단**이다 — "모르면 사람에게"가
 * 이 파이프라인의 기본값이다(수집기가 신고에 걸린 종목의 숫자를 지어내지 않는 것과 같은 규율).
 */
export const diffUniverseMembership = (
  base: UniverseMembershipView | null,
  head: UniverseMembershipView
): UniverseMembershipDiff => {
  const baseMembers = new Map((base?.members ?? []).map((member) => [member.ticker, member]));
  const headMembers = new Map(head.members.map((member) => [member.ticker, member]));

  const addedTickers = base === null ? [] : head.members.filter((member) => !baseMembers.has(member.ticker));
  const removedTickers = (base?.members ?? []).filter((member) => !headMembers.has(member.ticker));

  const etfChanges: EtfMembershipChange[] = [];
  if (base !== null) {
    for (const member of head.members) {
      const previous = baseMembers.get(member.ticker);
      if (!previous) continue;
      const before = new Set(previous.sourceEtfs);
      const after = new Set(member.sourceEtfs);
      const joined = member.sourceEtfs.filter((etf) => !before.has(etf));
      const left = previous.sourceEtfs.filter((etf) => !after.has(etf));
      if (joined.length > 0 || left.length > 0) {
        etfChanges.push({ ticker: member.ticker, name: member.name, joined, left });
      }
    }
  }

  const baseIssueKeys = new Set((base?.blockingIssues ?? []).map(issueKey));
  const headIssueKeys = new Set(head.blockingIssues.map(issueKey));
  const newBlockingIssues =
    base === null ? [] : head.blockingIssues.filter((issue) => !baseIssueKeys.has(issueKey(issue)));
  const clearedBlockingIssues = (base?.blockingIssues ?? []).filter(
    (issue) => !headIssueKeys.has(issueKey(issue))
  );

  addedTickers.sort(byTicker);
  removedTickers.sort(byTicker);
  etfChanges.sort(byTicker);
  newBlockingIssues.sort(byTicker);
  clearedBlockingIssues.sort(byTicker);

  const membershipChanged =
    addedTickers.length > 0 || removedTickers.length > 0 || etfChanges.length > 0;

  const blockReasons: string[] = [];
  if (base === null) blockReasons.push('비교할 직전 생성물이 없다(첫 도입) — 사람이 한 번은 봐야 한다');
  if (removedTickers.length > 0) {
    blockReasons.push(`제외 ${removedTickers.length}종(${removedTickers.map((m) => m.ticker).join(', ')})`);
  }
  if (addedTickers.length > 0) {
    blockReasons.push(`편입 ${addedTickers.length}종(${addedTickers.map((m) => m.ticker).join(', ')})`);
  }
  if (etfChanges.length > 0) {
    blockReasons.push(`편입 ETF 변화 ${etfChanges.length}종(${etfChanges.map((c) => c.ticker).join(', ')})`);
  }
  if (newBlockingIssues.length > 0) {
    blockReasons.push(
      `새 막는 신고 ${newBlockingIssues.length}건(${newBlockingIssues.map((i) => `${i.ticker}:${i.kind}`).join(', ')})`
    );
  }

  return {
    baselineMissing: base === null,
    addedTickers,
    removedTickers,
    etfChanges,
    newBlockingIssues,
    clearedBlockingIssues,
    membershipChanged,
    blocked: blockReasons.length > 0,
    blockReasons,
    counts: { base: base?.members.length ?? 0, head: head.members.length }
  };
};

/* ────────────────────────────── PR 본문 ────────────────────────────── */

const bullet = (member: UniverseMemberView): string =>
  `- \`${member.ticker}\` ${member.name}${member.sourceEtfs.length > 0 ? ` — ${member.sourceEtfs.join('+')}` : ''}`;

/**
 * PR 본문(마크다운). **사람이 이 글만 읽고 머지 여부를 정할 수 있어야 한다** — 그래서 판정과 그 이유를
 * 맨 위에 두고, 숫자는 전부 이번 수집본에서 실제로 센 값만 쓴다(지어낸 값 0).
 */
export const formatMembershipReport = (
  diff: UniverseMembershipDiff,
  head: UniverseMembershipView,
  health: CollectionHealth
): string => {
  const lines: string[] = [];
  lines.push('월간 배당 후보 유니버스 갱신 — `shared/constants/dividendLists/dividendLists.universe.generated.json`');
  lines.push('');
  lines.push(`수집 기준일 \`${head.asOf ?? '알 수 없음'}\` · 후보 ${diff.counts.base}종 → **${diff.counts.head}종**`);
  lines.push('');

  lines.push('## 판정');
  if (diff.blocked) {
    lines.push('🟥 **자동 머지를 막았다.** 아래를 사람이 확인하고 직접 머지해야 한다.');
    lines.push('');
    for (const reason of diff.blockReasons) lines.push(`- ${reason}`);
    lines.push('');
    lines.push(
      '> 종목이 빠졌다는 것은 배당 삭감이나 지수 탈락을 뜻한다. 목록을 DB 가 아니라 커밋되는 JSON 에 둔 이유가 그것이다.'
    );
  } else {
    lines.push('🟩 **필드만 바뀌었다**(가격·배당률·성장률·섹터). 종목 구성은 그대로라 예약 실행이면 자동 머지한다.');
  }
  lines.push('');

  if (diff.addedTickers.length > 0) {
    lines.push(`### 편입 +${diff.addedTickers.length}`);
    for (const member of diff.addedTickers) lines.push(bullet(member));
    lines.push('');
  }
  if (diff.removedTickers.length > 0) {
    lines.push(`### 제외 -${diff.removedTickers.length}`);
    for (const member of diff.removedTickers) lines.push(bullet(member));
    lines.push('');
    lines.push('제외된 종목이 정말 지수에서 빠졌는지, 아니면 소스 파일 파싱이 반쯤 깨진 것인지 먼저 확인하라.');
    lines.push('');
  }
  if (diff.etfChanges.length > 0) {
    lines.push(`### 편입 ETF 변화 ${diff.etfChanges.length}종`);
    for (const change of diff.etfChanges) {
      const parts: string[] = [];
      if (change.left.length > 0) parts.push(`${change.left.join('+')} 빠짐`);
      if (change.joined.length > 0) parts.push(`${change.joined.join('+')} 편입`);
      lines.push(`- \`${change.ticker}\` ${change.name} — ${parts.join(' · ')}`);
    }
    lines.push('');
    lines.push('편입 ETF 가 바뀌면 연속 증배 연수 **하한**(`minimumStreakYears`)도 함께 바뀐다.');
    lines.push('');
  }
  if (diff.newBlockingIssues.length > 0) {
    lines.push(`### 새 막는 신고 ${diff.newBlockingIssues.length}건`);
    for (const issue of diff.newBlockingIssues) {
      lines.push(`- \`${issue.ticker}\` **${issue.kind}** — ${issue.detail}`);
    }
    lines.push('');
  }
  if (diff.clearedBlockingIssues.length > 0) {
    lines.push(`### 풀린 신고 ${diff.clearedBlockingIssues.length}건`);
    for (const issue of diff.clearedBlockingIssues) lines.push(`- \`${issue.ticker}\` ${issue.kind}`);
    lines.push('');
  }

  lines.push('## 커버리지');
  if (head.coverage) {
    lines.push(
      `- 지표 ${head.coverage.withMetrics}/${head.coverage.total} · ` +
        `섹터 ${head.coverage.withSector}/${head.coverage.total} · ` +
        `5년 성장률 ${head.coverage.withGrowth}/${head.coverage.total}`
    );
  }
  lines.push(`- 막는 신고 ${head.blockingIssues.length}건 (그중 이번에 새로 생긴 것 ${diff.newBlockingIssues.length}건)`);
  lines.push(`- ${health.detail}`);
  lines.push('');
  lines.push(
    '막는 신고에 걸린 종목은 `metrics` 가 비어 있다. 후보에서 빼지는 않는다 — "이 ETF 가 들고 있다"는 편입 사실은 여전히 참이고, 못 믿을 것은 계산한 숫자뿐이다.'
  );
  return `${lines.join('\n')}\n`;
};
