#!/usr/bin/env node
/**
 * UserPromptSubmit 훅 — 사용자 프롬프트를 orchestrator 서브에이전트로 라우팅한다.
 *
 * 참고 구현(roadmapforall)은 셸 `echo`로 JSON을 뱉지만, Windows(cmd.exe)에서는 따옴표가
 * 그대로 출력돼 JSON 파싱이 깨진다. Node 스크립트로 출력해 OS와 무관하게 동작하게 한다.
 *
 * 이 라우팅을 끄고 싶으면 .claude/settings.json 의 hooks 블록을 지우면 된다.
 */

const policy = [
  'ROUTING POLICY: Route this user prompt through the orchestrator subagent.',
  'First check the exceptions — if the prompt is a trivial conversational message,',
  'a quick question answerable from the current conversation, a slash command or skill invocation,',
  'or it explicitly names a specific agent / says to skip the orchestrator, handle it directly as usual.',
  'Otherwise: call the Agent tool with subagent_type "orchestrator", passing the user prompt verbatim',
  'plus a short brief of relevant conversation context, file paths, and constraints,',
  'since subagents cannot see the conversation history.',
  'The orchestrator will decompose the request and delegate to the fitting specialists',
  '(simulation-engineer, state-engineer, frontend-engineer, ui-ux-designer, ticker-data-curator,',
  'qa-tester, reviewer, perf-optimizer, analytics-analyst, git-manager, docs-seo-writer,',
  'etf-seo-page-builder for ETF/ticker SEO landing pages),',
  'and hand product-definition requests (new feature ideas, what to build next, scope questions)',
  'to pm-po first for goals, scope, and acceptance criteria.',
  'When it returns, verify and relay the outcome to the user in Korean.',
].join(' ');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: policy,
    },
  })
);
