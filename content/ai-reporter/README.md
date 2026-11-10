# AI 리포터 데이터 (ai-reporter 브랜치 전용)

이 브랜치는 AI 리포터의 **기록 대장·초안**을 담는다. ⚠ main 에 머지하지 않는다.
여기 있는 코드는 쓰이지 않는다 — 실행 코드는 항상 main 에서 가져온다(`.github/workflows/ai-reporter-*.yml`).

- `ledger.json` — 발행된 회차(중복 방지의 기준)
- `next-facts.json` — 다음 회차 사실(월·목 07:00 KST, Actions 가 씀)
- `inbox/` — 루틴이 쓴 초안(월·목 08:00 KST) · `published/` — 발행된 초안
- `last-error.json` — 검사 거부 사유(다음 루틴이 읽고 고친다)
