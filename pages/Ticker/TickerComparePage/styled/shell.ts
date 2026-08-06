import styled from '@emotion/styled';

/* ──────────────────────────────────────────────────────────────────────────
   화면 골격 — 어느 구획에도 속하지 않고 지면 전체에 걸리는 둘.
   ────────────────────────────────────────────────────────────────────────── */

/** 화면 세로 리듬. 블록 사이를 종전(16~28)보다 벌려 네 덩어리가 각각 하나의 생각으로 읽히게 한다. */
export const Stack = styled.div`
  display: grid;
  gap: clamp(20px, 3.2vw, 34px);
  min-width: 0;
`;

/* ── 각주 ──────────────────────────────────────────────────────────────────── */

/*
 * 🔴 이 화면은 각주를 **자기 손으로 그리지 않는다.** 공용 `PageFooter` 의 `notes` 슬롯에 넣는다
 * (구 `FootBlock`/`FootNote` 는 그래서 삭제됐다). 허브·상세와 같은 자리·같은 모양으로 끝나야
 * 세 지면이 한 제품으로 읽히고, 법무 2링크도 이 지면에 함께 선다.
 */

/** 스크린리더 전용. 시각 표식(가장 높음 등)이 이미 텍스트라 여기서는 구조 설명에만 쓴다. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;
