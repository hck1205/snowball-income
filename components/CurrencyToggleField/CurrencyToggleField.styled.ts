import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 투자 설정 카드의 한 행(토글 줄 + 캡션).
 *
 * 토글 줄 자체는 `ToggleField`가 그린다 — 같은 카드의 "빠른 추정 보기"/"그래프 나누어 보기"와
 * **같은 컴포넌트·같은 라벨 줄**이라 타이포·간격·정렬이 자동으로 일치한다.
 * 여기서는 그 아래에 캡션을 한 줄 붙이는 일만 한다(자체 면색·테두리 없음).
 */
export const Root = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

/** 환산 근거·사유 안내. 환율 위젯의 as-of 라벨과 같은 톤(muted·xs·numeric). */
export const Caption = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  ${font.numeric}

  /*
   * 캡션이 비는 기본(원화) 모드에서 빈 줄 높이를 없앤다.
   * ⚠ display:none / visibility:hidden 은 쓰지 않는다 — 그러면 이 role="status" 가 접근성 트리에서
   *   사라져 "항상 마운트"(loading→success 전이 낭독)라는 계약이 조건부 마운트와 같아진다.
   *   (styled 템플릿 리터럴 안에서는 백틱을 쓸 수 없어 코드 표기를 평문으로 둔다.)
   */
  &:empty {
    font-size: 0;
    line-height: 0;
  }
`;
