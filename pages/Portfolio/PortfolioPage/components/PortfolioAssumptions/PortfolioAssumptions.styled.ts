import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 가정 요약 — 접힘.
 *
 * ## 2026-08-03 리워크 — "선 하나"에서 **접히는 면**으로
 * 종전에는 왼쪽 2px 선 + 12px 회색 글자였다. 페이지 어디에도 속하지 않는 부유물처럼 보였고,
 * 접을 수 있다는 사실도 브라우저 기본 삼각형 하나가 전부였다. 지금은 **중립 침강 면 한 겹**이라
 * 위 카드들과 같은 형태 언어를 갖되(라운드·여백), 테두리 없이 면색만으로 한 단 낮게 앉는다.
 * 색면 예산 무침범 — `surface-sunken` 은 tintscan 의 중립 토큰이다.
 */
export const AssumptionsDetails = styled.details`
  min-width: 0;
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
`;

/**
 * 요약 줄 = **누를 수 있는 줄 전체**. 종전에는 글자 폭만 히트 영역이었다.
 * 열림 상태는 삼각형(브라우저 기본 마커)이 말하고, 여기서는 여백·호버 면만 준다.
 */
export const AssumptionsSummary = styled.summary`
  cursor: pointer;
  padding: ${space[3]} clamp(16px, 2vw, 20px);
  border-radius: ${radius.lg};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  list-style-position: inside;

  &:hover {
    color: ${color.text};
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const AssumptionsBody = styled.div`
  display: grid;
  gap: ${space[4]};
  margin: 0;
  padding: 0 clamp(16px, 2vw, 20px) clamp(16px, 2vw, 20px);
`;

export const TaxFieldSlot = styled.div`
  max-width: 200px;
`;

/**
 * 가정 요약 안의 두 번째 그룹 제목(예상 달성 시점 계산 조건).
 *
 * 접힘 블록을 새로 만들지 않고 **그룹 제목 한 줄**로 소속을 밝힌다 — 같은 라벨(배당소득세)이 두 번
 * 나와도 각 행이 자기 기준을 말하면 모순이 아니다. `h3`(카드 `h2` 아래 위계)로 두어 제목 목록에서도 읽힌다.
 */
export const AssumptionsGroupTitle = styled.h3`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.textSecondary};
`;

export const AssumptionsGroupNote = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const ConditionsList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${space[2]} ${space[4]};

  ${media.down('mobile')} {
    grid-template-columns: 1fr;
  }
`;

export const ConditionRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const ConditionTerm = styled.dt`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const ConditionValue = styled.dd`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;
