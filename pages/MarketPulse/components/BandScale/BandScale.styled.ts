import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 이름 붙은 구간 위에 현재 값을 찍는 가로 스케일.
 *
 * 🔴 **ECharts 로 만들지 않았다.** 이건 데이터 시각화가 아니라 **범례에 가깝다** — 캔버스를 하나 더
 *    띄우면 카드마다 차트 인스턴스가 둘이 되고(리사이즈 관찰자도 둘), 얻는 것은 같은 그림이다.
 *    DOM 으로 그리면 구간 이름이 **진짜 글자**라 스크린리더가 읽고 브라우저 검색에도 걸린다.
 * ⚠ 색은 토큰만. 그리고 색 하나에 기대지 않는다 — 구간 이름이 띠 아래 글자로 함께 선다.
 */

const toneColor = (tone: string) =>
  tone === 'calm'
    ? color.accent
    : tone === 'normal'
      ? color.identity
      : tone === 'elevated'
        ? color.warning
        : color.danger;

export const ScaleRoot = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const ScaleTrack = styled.div`
  position: relative;
  display: flex;
  height: 14px;
  border-radius: ${radius.pill};
  overflow: hidden;
`;

export const ScaleBand = styled.span<{ $tone: string; $width: number }>`
  flex: ${(props) => props.$width} 0 0;
  background: ${(props) => toneColor(props.$tone)};
  opacity: 0.55;
`;

/**
 * 현재 값 표시자.
 *
 * ⚠ `left` 만으로는 양끝에서 반쯤 잘린다 — `translateX(-50%)` 로 중심을 맞추되, 컨테이너가
 *   `overflow: hidden` 이라 0%·100% 에서는 잘린다. 그래서 마커를 **트랙 밖**에 얹는다.
 */
export const MarkerLayer = styled.div`
  position: relative;
  height: 0;
`;

export const Marker = styled.span<{ $left: number }>`
  position: absolute;
  top: -19px;
  left: ${(props) => props.$left * 100}%;
  transform: translateX(-50%);
  width: 3px;
  height: 24px;
  border-radius: ${radius.pill};
  background: ${color.text};
  box-shadow: 0 0 0 2px ${color.surface};
`;

export const BandLabels = styled.div`
  display: flex;
  gap: ${space[1]};
`;

/**
 * 구간 이름. **현재 구간만 진하게** — 넷을 같은 무게로 두면 지금 어디인지가 안 읽힌다.
 * 🔴 굵기와 색 **둘 다** 바뀐다. 색만 바꾸면 색각 이상 사용자에게는 넷이 같은 글자다.
 */
export const BandLabel = styled.span<{ $width: number; $active: boolean }>`
  flex: ${(props) => props.$width} 0 0;
  min-width: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${(props) => (props.$active ? font.weight.bold : font.weight.regular)};
  color: ${(props) => (props.$active ? color.text : color.textMuted)};
  text-align: center;
  overflow-wrap: anywhere;
`;
