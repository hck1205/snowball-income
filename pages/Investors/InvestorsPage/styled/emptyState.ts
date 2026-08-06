import styled from '@emotion/styled';
import { DATA_RADIUS, DATA_SURFACE, color, font, space } from '@/shared/styles';

/* ── ⑤ 빈 상태 · 각주 ──────────────────────────────────────────────────────── */

/**
 * 🔴 **빈 상태** — 1차까지 없던 화면이다.
 *
 * 면은 **중립**이다. 예산이 이미 2면(히어로 + 경고 밴드)으로 차 있어 brand 틴트 면을 세울 수 없다.
 * 대신 마스코트 라인아트가 `color.identity` 로 서서 "고장이 아니라 비어 있음"을 말한다
 * (BrandGlyph 는 브랜드 표면 전용이고 빈 상태가 그 자리다 — 데이터 표면엔 쓰지 않는다).
 */
export const EmptyPanel = styled.section`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: clamp(32px, 6vw, 64px) ${DATA_SURFACE.pad};
  border: 1px dashed ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surfaceSunken};
  text-align: center;
  color: ${color.identity};
`;

/**
 * 빈 상태 제목 — 전 화면 공통 곡선 `clamp(2xl, 2.6vw, 4xl)`(20~30px).
 * 종전 `sectionTitleFontSize`(16~18px)는 카드 제목과 같은 단이라, 화면에 이 문장 하나뿐인
 * 상황에서도 아무것도 앞서 읽히지 않았다. 시뮬레이터·캘린더·포트폴리오의 빈 상태와 같은 단으로 맞춘다.
 */
export const EmptyTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 40ch;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/** 합산할 것이 없을 때. 표 자리에 빈 표를 세우지 않는다. */
export const InlineEmpty = styled.p`
  margin: 0;
  padding: ${space[6]} 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  text-align: center;
`;

/**
 * 면책·출처. 🔴 카드에서 **선 하나**로 내렸다 — 이 줄은 읽히는 것이 아니라 있어야 하는 것이고,
 * 침강 카드로 두면 화면 끝에 또 하나의 블록이 서서 마지막 인상이 회색 상자가 된다.
 */
export const FootNoteRow = styled.div`
  display: grid;
  gap: ${space[1]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const FootNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
`;

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
