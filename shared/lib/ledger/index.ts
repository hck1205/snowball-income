/**
 * 가계부의 **규칙 계층** — 어휘(`shared/constants/ledger`)와 시트(`shared/lib/googleSheets`) 사이.
 *
 * ⚠ 의존은 한 방향이다: `constants/ledger` ← **`lib/ledger`** ← `lib/googleSheets`.
 *   이 폴더는 시트를 몰라야 한다. CSV·붙여넣기가 들어와도 같은 규칙을 그대로 쓴다.
 */
export * from './classify';
