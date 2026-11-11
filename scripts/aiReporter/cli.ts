import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { composeBody } from './compose';
import { publishBoardPost, readReporterEnv, updateReporterPost } from './publish';
import { checkDraft } from './rules';
import { factsFromKey, nextFacts } from './select';
import type { ReporterDraft, ReporterLedger, ReporterTopic } from './types';


/**
 * AI 리포터 CLI(2026-11-10).
 *
 *   npm run reporter -- facts --ledger <대장.json> [--topic week-ahead|income-target|ticker-spotlight|gallery-portfolio]
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
    // 표·첨부는 프로그램 몫이라 루틴(LLM)에 넘기지 않는다 — 읽을 분량이 줄어 비용도 준다.
    const { tablesHtml: _tables, attachment: _attachment, ...forWriter } = facts;
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

    const section = facts.attachment ? 'portfolio' : 'board';

    // 고쳐 쓰기 — 같은 글(주소)을 그대로 두고 제목·요약·본문만 바꾼다. 대장은 그 줄의 제목만 갱신한다.
    if (draft.replacesPostId) {
      await updateReporterPost(readReporterEnv(), draft.replacesPostId, {
        title: draft.title.trim(),
        description: draft.description.trim(),
        body: composeBody(draft, facts)
      });
      const next: ReporterLedger = {
        entries: ledger.entries.map((entry) => (entry.postId === draft.replacesPostId ? { ...entry, title: draft.title.trim() } : entry))
      };
      if (ledgerPath) writeFileSync(ledgerPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
      console.log(`✓ 고쳐 씀 — /community/${section}/${draft.replacesPostId}`);
      return 0;
    }

    const isPublic = flag('public');
    const { postId } = await publishBoardPost(readReporterEnv(), {
      title: draft.title.trim(),
      description: draft.description.trim(),
      body: composeBody(draft, facts),
      category: facts.category,
      isPublic,
      ...(facts.attachment ? { attachment: { payload: facts.attachment.payload, simSummary: facts.attachment.simSummary } } : {})
    });
    const next: ReporterLedger = {
      entries: [
        ...ledger.entries,
        { factKey: facts.factKey, topic: facts.topic, title: draft.title.trim(), publishedAt: new Date().toISOString(), postId }
      ]
    };
    if (ledgerPath) writeFileSync(ledgerPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log(`✓ 게시 ${isPublic ? '(공개)' : '(비공개)'} — /community/${section}/${postId}`);
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
