import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';
import { MEASURE } from './metrics';

/* ── 참고 지표: 타일 격자 → 스펙 표 ─────────────────────────────────────────── */

/**
 * 참고 지표.
 *
 * 종전에는 타일 8개가 각자 테두리를 갖는 격자였다 — 값 하나하나가 카드가 되면 **비교**가 안 된다
 * (읽는 눈이 카드 경계를 넘느라 값의 축을 잃는다). 스펙 시트는 표의 문법이 맞다: 라벨 좌 · 값 우 ·
 * 행 사이 헤어라인. 값이 한 축에 정렬돼 위에서 아래로 훑힌다.
 */
export const SpecTable = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(24px, 3vw, 48px);
  border-top: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SpecRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[4]};
  padding: ${space[3]} 0;
  border-bottom: 1px solid ${color.border};
  min-width: 0;
`;

export const SpecLabel = styled.dt`
  flex: 0 0 auto;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const SpecValue = styled.dd`
  margin: 0;
  min-width: 0;
  text-align: right;
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/**
 * 섹터 비중 — 나란한 칩에서 **순위 목록**으로.
 *
 * 데이터가 가진 정보는 "비중 큰 순서"뿐인데(정확한 %가 없다), 같은 크기 칩을 늘어놓으면 그 순서가
 * 사라진다. 앞에 순위 숫자를 세우면 데이터가 실제로 가진 정보가 화면에도 남는다.
 */
export const SectorRank = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const SectorRankItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px ${space[3]} 5px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const SectorRankNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric};
`;

export const SectorRankLabel = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

/** 기준 시점·출처 각주. 본문 폭보다 좁게 두고 한 단 옅게 — 읽히되 먼저 읽히지 않는다. */
export const AsOfNote = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  padding-left: ${space[3]};
  border-left: 2px solid ${color.border};
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.relaxed};
`;
