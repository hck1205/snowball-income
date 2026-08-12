// @vitest-environment node — 파일만 읽는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 데이터 자동화 **워크플로 자체**의 계약.
 *
 * 이 레포의 데이터 파이프라인은 화면에 증상을 내지 않는다 — 갱신이 멈춰도 앱은 어제 데이터로 멀쩡히
 * 그려진다. 2026-08 에 두 파이프라인이 나흘간 멈춰 있었는데 아무도 몰랐고, 우연히 발견했다.
 * 그래서 "알림이 붙어 있는가"는 편의가 아니라 **이 자동화가 자동화인지를 정하는 조건**이다.
 *
 * 🔴 여기서 막는 재발은 하나다: **새 갱신 워크플로가 알림망 밖에 조용히 놓이는 것.**
 *    `workflow_run` 은 감시할 워크플로를 **이름으로 열거**해야 해서, 목록에 안 적으면 아무 일도
 *    일어나지 않는다 — 실패해도 조용하다. 히든스타가 제외 집합에 자기 목록을 넣어 선정 0종이 됐던
 *    것과 같은 모양의 함정이다(규칙은 도는데 결과가 없고, 아무도 안 알려 준다).
 *
 * YAML 파서를 들이지 않고 원문을 읽는다 — 의존성을 하나 더할 만큼 넓은 계약이 아니고,
 * `check-curated-calendar.yml` 이 이미 같은 방식(grep)으로 상수를 읽는다.
 */

const WORKFLOW_DIR = fileURLToPath(new URL('../../.github/workflows/', import.meta.url));

const NOTIFIER_FILE = 'notify-refresh-failure.yml';

/**
 * 알림 대상에서 빼는 워크플로 — **의식적인 제외만 여기 적는다.**
 *
 * `ci.yml` 은 실패가 PR 화면에 즉시 보인다. 자동화 실패와 달리 사람이 그 결과를 기다리고 있는
 * 신호라 이슈로 또 알리면 소음이다. (main 푸시 실패까지 알리고 싶어지면 알림 워크플로의
 * `workflows:` 에 `CI` 를 더하고 여기서 빼면 된다 — 그때 이 테스트가 짝을 맞춰 준다.)
 */
const NOT_ALERTED = new Set(['ci.yml']);

/**
 * ⚠ 줄바꿈을 **반드시 정규화**한다. 이 레포는 Windows 에서 개발하고 git 이 체크아웃 때 CRLF 로
 * 바꾸는데, JS 정규식의 `.` 은 `\r` 을 매치하지 않는다 — `.+\n` 형태의 검사가 새로 clone 한
 * 환경에서만 통째로 실패한다(2026-08-12 실측: 커밋 직후 재체크아웃에서 드러났다).
 * 러너는 LF 라 CI 는 초록인데 로컬만 빨간, 원인 찾기 나쁜 종류다.
 */
const read = (file: string): string => readFileSync(`${WORKFLOW_DIR}${file}`, 'utf8').replace(/\r\n/g, '\n');

const workflowFiles = readdirSync(WORKFLOW_DIR).filter((file) => file.endsWith('.yml'));

/** 워크플로의 표시 이름(`name:`) — `workflow_run` 이 매칭에 쓰는 값이다(경로가 아니다). */
const displayName = (file: string): string => {
  const match = read(file).match(/^name:[ \t]*(.+)$/m);
  if (!match) throw new Error(`${file} 에 최상위 name: 이 없다.`);
  return match[1].trim();
};

/**
 * 최상위 키 하나의 블록을 통째로 꺼낸다(다음 최상위 키 전까지).
 *
 * ⚠ 들여쓰기가 계약이라 **탐색은 반드시 그 줄의 다음 줄부터** 한다. 시작점부터 `^\S` 를 찾으면
 *   슬라이스의 0번이 곧 줄머리로 취급돼 자기 자신에 걸린다(한 글자만 돌려주고, 그러면 아래 검사가
 *   전부 빨개진다 — 반대로 과하게 잡으면 잡 레벨 값까지 통과시켜 **조용히 무의미한 가드**가 된다).
 */
const topLevelBlock = (source: string, key: string): string => {
  const start = source.search(new RegExp(`^${key}:`, 'm'));
  if (start < 0) return '';
  const rest = source.slice(start);
  const bodyStart = rest.indexOf('\n') + 1;
  if (bodyStart <= 0) return rest;
  const next = rest.slice(bodyStart).search(/^\S/m);
  return next < 0 ? rest : rest.slice(0, bodyStart + next);
};

const notifier = read(NOTIFIER_FILE);

/** 알림 워크플로가 실제로 감시하는 이름들. */
const watchedNames = (() => {
  const list = notifier.match(/^[ \t]*workflows:\n((?:[ \t]*-[ \t].+\n)+)/m);
  if (!list) throw new Error(`${NOTIFIER_FILE} 에서 workflow_run 의 workflows: 목록을 찾지 못했다.`);
  return list[1]
    .split('\n')
    .map((line) => line.replace(/^[ \t]*-[ \t]*/, '').trim())
    .filter(Boolean);
})();

const alertedFiles = workflowFiles.filter((file) => file !== NOTIFIER_FILE && !NOT_ALERTED.has(file));

describe('실패 알림 — 자동화가 조용히 죽지 않게 하는 그물', () => {
  it('🔴 알림 대상이 아닌 워크플로는 명시적으로 제외한 것뿐이다', () => {
    // 새 `refresh-*.yml` 을 만들면 이 테스트가 먼저 빨개진다 — 알림 목록에 이름을 적으라는 뜻이다.
    expect([...watchedNames].sort()).toEqual(alertedFiles.map(displayName).sort());
  });

  it('감시 목록의 이름이 전부 실제 워크플로의 name: 과 일치한다', () => {
    // `workflow_run` 은 없는 이름을 조용히 무시한다 — 오타 하나로 그 파이프라인만 알림망 밖에 놓인다.
    const everyName = new Set(workflowFiles.map(displayName));
    expect(watchedNames.filter((name) => !everyName.has(name))).toEqual([]);
  });

  it('🔴 알림 워크플로는 자기 자신을 감시하지 않는다', () => {
    // 자기를 감시하면 알림이 실패했을 때 그 실패가 다시 자기를 깨워 되먹임이 된다.
    expect(watchedNames).not.toContain(displayName(NOTIFIER_FILE));
  });

  it('이슈를 열고 닫을 권한이 있다', () => {
    // 권한이 없으면 실패하는 것은 알림 워크플로 자신이고, 그 실패는 아무도 안 알려 준다.
    expect(topLevelBlock(notifier, 'permissions')).toMatch(/issues:[ \t]*write/);
  });

  it('🔴 checkout 없이 gh 를 쓰므로 대상 저장소를 명시한다', () => {
    /*
     * `gh` 는 저장소를 **git remote 로 알아낸다.** 이 잡은 코드가 필요 없어 checkout 을 하지 않으니
     * 러너에 `.git` 이 없고, 그러면 첫 gh 호출이 통째로 죽는다:
     *   `failed to run git: fatal: not a git repository`
     * 2026-08-12 첫 실물 검증에서 세 번 다 이 자리에서 실패했다 — 문법도 권한도 멀쩡했고,
     * 로컬에서는 레포 안에서 돌려 봐서 안 드러났다. **환경이 다른 것을 테스트가 대신 기억한다.**
     */
    const usesCheckout = /uses:[ \t]*actions\/checkout/.test(notifier);
    const declaresRepo = /GH_REPO:/.test(topLevelBlock(notifier, 'env'));
    expect(usesCheckout || declaresRepo).toBe(true);
  });
});

describe('블록 추출기 — 아래 검사가 헛돌지 않게 하는 자기검증', () => {
  const sample = ['name: X', 'env:', '  TZ: Asia/Seoul', 'jobs:', '  build:', '    env:', '      TZ: UTC', ''].join('\n');

  it('다음 최상위 키 앞에서 끊는다 — 잡 레벨 값을 최상위로 오인하지 않는다', () => {
    // 이 경계가 무너지면 아래 TZ 검사는 잡 안에만 있는 값으로도 통과한다. 그게 바로 이번에 깨졌던 형태다.
    expect(topLevelBlock(sample, 'env')).toBe('env:\n  TZ: Asia/Seoul\n');
  });

  it('키가 없으면 빈 문자열이다 — 없는 것을 있는 것처럼 말하지 않는다', () => {
    expect(topLevelBlock(sample, 'permissions')).toBe('');
  });
});

describe('워크플로 공통 계약 — 앞서 조용히 깨졌던 것들', () => {
  it.each(workflowFiles)('%s 는 워크플로 레벨에서 TZ 를 KST 로 고정한다', (file) => {
    /*
     * 🔴 Node **시작 전에** 심어야 하는 값이다(2026-08-11 회귀). V8 은 첫 Date 사용 시점에 타임존을
     *    캐시하므로 `vitest.config` 의 `env.TZ` 처럼 프로세스가 뜬 뒤 넣은 값은 Date/Intl 에 반영되지
     *    않는다. 잡 레벨이 아니라 **최상위 env** 여야 모든 잡·모든 단계가 덮인다.
     */
    expect(topLevelBlock(read(file), 'env')).toMatch(/TZ:[ \t]*Asia\/Seoul/);
  });

  it.each(workflowFiles)('%s 가 데이터를 커밋한다면 api 번들도 함께 갱신한다', (file) => {
    /*
     * 🔴 `api/*.js` 는 커밋되는 배포 산출물이고 `seo-html`·`og` 번들은 데이터를 **품고 있다**.
     *    데이터만 커밋하면 산출물이 소스와 어긋나 `api:check` 가 실패한다 — 자동 머지되는 일간
     *    갱신이 그 상태로 main 을 깨뜨리면, 그 뒤 모든 PR 이 원인과 무관한 곳에서 빨개진다(2026-08-12).
     */
    const source = read(file);
    if (!source.includes('git add ')) return;
    expect(source).toContain('npm run api:bundle');
    expect(source).toMatch(/git add .*\bapi\b/);
  });
});
