/**
 * 가계부 v2 의 **어휘** — 분류 사전과 직교 축. 순수 상수·순수 함수만 산다(IO·컴포넌트 없음).
 *
 * ⚠ `shared/lib/googleSheets`(데이터 계층)가 이 폴더를 쓴다. 반대 방향 import 는 만들지 마라 —
 *   어휘는 시트를 몰라야 한다. CSV 업로드·붙여넣기도 같은 어휘를 쓰게 될 것이고, 그때
 *   구글 시트에 묶여 있으면 통째로 딸려 온다.
 *
 * 설계 근거 전문: docs/ledger-v2-design.md
 */
export * from './categories';
export * from './axes';
export * from './holdings';
