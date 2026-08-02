#!/usr/bin/env node
/**
 * PostToolUse 훅 — `*.styled.ts` 를 편집한 **직후** 백틱 함정을 잡는다.
 *
 * ## 왜 있나
 * Emotion `styled` 템플릿 **안**의 주석에 백틱을 쓰면 템플릿 리터럴이 그 자리에서 끊긴다.
 * 타입체크는 통과하고 테스트도 대개 통과하는데 **앱이 부팅하지 않는다** — 화면이 빈 채로 뜬다.
 * 원인이 주석이라 아무도 의심하지 않아서, 이 레포에서 실제로 두 번 시간을 크게 날렸다:
 *   - 2026-08-02 새벽: 헤더 회귀로 30분 오해(headerprobe 의 `h=null` 이 부팅 실패와 구분되지 않는다)
 *   - 2026-08-02 오전: 여백 수정 뒤 화면이 비어 브라우저 실측 왕복 2회를 낭비
 * 둘 다 `node tools/dev/styled-comment-backticks.mjs` 로 **2초**면 알 수 있었다. 사람이 기억하지 못했을 뿐이다.
 *
 * 그래서 기억을 그만두고 훅으로 내린다. 편집 직후에 걸리므로 다음 도구 호출 전에 알게 된다.
 *
 * ## 규율
 * - **관련 없는 편집에는 아무 말도 하지 않는다**(`.styled.ts` 가 아니면 즉시 0 으로 종료).
 * - 검사기가 없거나 실패해도 **작업을 막지 않는다** — 훅이 개발을 세우면 훅을 지우게 된다.
 *   위반이 있을 때만 stderr 로 알리고 exit 2 로 모델에게 되돌려 준다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/** 훅 입력(JSON)은 stdin 으로 온다. 못 읽으면 조용히 통과 — 훅이 워크플로를 깨뜨리지 않는다. */
const readInput = () => {
  try {
    return JSON.parse(readFileSync(0, 'utf-8'));
  } catch {
    return null;
  }
};

const input = readInput();
const filePath = input?.tool_input?.file_path ?? '';

// styled 파일이 아니면 볼 것이 없다.
if (!filePath.endsWith('.styled.ts')) process.exit(0);

const CHECKER = 'tools/dev/styled-comment-backticks.mjs';
if (!existsSync(CHECKER)) process.exit(0);

const result = spawnSync(process.execPath, [CHECKER], { encoding: 'utf-8' });

// 검사기가 못 돌았으면(예: 실행 환경 문제) 막지 않는다.
if (result.error || result.status === null) process.exit(0);
if (result.status === 0) process.exit(0);

process.stderr.write(
  [
    '🔴 styled 템플릿 안 주석에 백틱이 있다 — 이 상태로는 앱이 부팅하지 않는다(화면이 빈 채로 뜬다).',
    '   방금 편집한 파일: ' + filePath,
    '   주석 안의 백틱을 지워라. 코드 참조는 백틱 없이 이름만 적는다.',
    '',
    (result.stdout || '').trim(),
    (result.stderr || '').trim()
  ]
    .filter(Boolean)
    .join('\n')
);

// exit 2 = 모델에게 stderr 를 돌려준다(작업을 되돌리지는 않는다).
process.exit(2);
