import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { composeBody } from './compose';
import { publishBoardPost, readReporterEnv } from './publish';
import { checkDraft } from './rules';
import { factsFromKey, nextFacts } from './select';
import type { ReporterDraft, ReporterLedger, ReporterTopic } from './types';


/**
 * AI 리포터 CLI(2026-11-10).
 *
 *   npm run reporter -- facts --ledger <대장.json> [--topic week-ahead|income-target|ticker-spotlight]
 *       → 다음 회차의 사실(JSON)을 출력한다. 주제를 주지 않으면 직전 주제와 다른 것을 고른다.
 *         루틴(LLM)은 이 출력의 highlights·numbers 만 보고 제목·짧은 본문을 쓴다.
 *   npm run reporter -- check --ledger <대장.json> --draft <초안.json>
 *       → 검사만(쓰지 않는다).
 *   npm run reporter -- publish --ledger <대장.json> --draft <초안.json> [--public]
 *       → 검사 통과 시 AI 리포터 계정으로 게시하고 대장에 한 줄 더한다.
 *         `--public` 이 없으면 비공개(초안)로 올린다.
 */

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const flag = (name: string): boolean => process.argv.includes(`--${name}`);

const readLedger = (path: string | undefined): ReporterLedger => {
  if (!path || !existsSync(path)) return { entries: [] };
  return JSON.parse(readFileSync(path, 'utf8')) as ReporterLedger;
};

const todayKst = (): Date => {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};

const main = async (): Promise<number> => {
  const command = process.argv[2];
  const ledgerPath = arg('ledger');
  const ledger = readLedger(ledgerPath);
  const today = todayKst();

  if (command === 'facts') {
    const topic = arg('topic') as ReporterTopic | undefined;
    const facts = nextFacts(ledger, today, topic);
    if (!facts) {
      console.log(JSON.stringify({ skip: true, reason: '이번 회차에 새로 쓸 사실이 없다 — 건너뛴다' }));
      return 0;
    }
    const { tablesHtml: _tables, ...forWriter } = facts;
    console.log(JSON.stringify(forWriter, null, 2));
    return 0;
  }

  if (command === 'check' || command === 'publish') {
    const draftPath = arg('draft');
    if (!draftPath) throw new Error('--draft 가 필요하다');
    const draft = JSON.parse(readFileSync(draftPath, 'utf8')) as ReporterDraft;
    // 발행 시점에 사실을 **다시 만든다** — 루틴이 보고 쓴 것과 같은 회차·같은 데이터인지 확인하는 것이다.
    const facts = factsFromKey(draft.factKey);
    if (!facts) throw new Error(`초안의 factKey 로 사실을 다시 만들 수 없다: ${draft.factKey}`);

    const result = checkDraft(draft, facts, ledger);
    if (!result.ok) {
      console.error(`✗ 검사 실패 ${result.errors.length}건`);
      for (const error of result.errors) console.error(`  · ${error}`);
      return 1;
    }
    console.log('✓ 검사 통과');
    if (command === 'check') return 0;

    const isPublic = flag('public');
    const { postId } = await publishBoardPost(readReporterEnv(), {
      title: draft.title.trim(),
      description: draft.description.trim(),
      body: composeBody(draft, facts),
      category: facts.category,
      isPublic
    });
    const next: ReporterLedger = {
      entries: [
        ...ledger.entries,
        { factKey: facts.factKey, topic: facts.topic, title: draft.title.trim(), publishedAt: new Date().toISOString(), postId }
      ]
    };
    if (ledgerPath) writeFileSync(ledgerPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log(`✓ 게시 ${isPublic ? '(공개)' : '(비공개)'} — /community/board/${postId}`);
    return 0;
  }

  console.error('사용법: npm run reporter -- facts|check|publish --ledger <대장.json> [--draft <초안.json>] [--topic …] [--public]');
  return 2;
};

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
