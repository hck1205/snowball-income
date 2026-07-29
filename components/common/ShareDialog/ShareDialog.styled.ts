import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/** 창 안의 세로 리듬. 제목·주소·채널이 같은 간격으로 쌓인다. */
export const ShareBody = styled.div`
  display: grid;
  gap: ${space[4]};
`;

export const ShareSection = styled.section`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const ShareSectionLabel = styled.h4`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/** 주소 입력의 라벨. 위 제목과 같은 타이포지만 `<label for>` 여야 입력과 묶인다. */
export const ShareLinkLabel = ShareSectionLabel.withComponent('label');

/** 주소 + 복사 버튼 한 줄. 좁은 폭에서는 버튼이 아래로 내려간다. */
export const ShareLinkRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  flex-wrap: wrap;
`;

/**
 * 공유 주소를 **읽기 전용 입력**으로 보여 준다. 클립보드가 막힌 환경(권한 거부·비보안 컨텍스트)에서도
 * 사용자가 직접 선택해 복사할 수 있어야 공유가 성립한다 — 그래서 텍스트가 아니라 입력이다.
 */
export const ShareLinkInput = styled.input`
  flex: 1 1 220px;
  min-width: 0;
  height: 40px;
  box-sizing: border-box;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-family: inherit;
  text-overflow: ellipsis;

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const ShareChannelList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/**
 * 채널 버튼 — 아이콘 + 이름을 **둘 다** 쓴다. 브랜드 글리프만 두면 무엇인지 모르는 사람이 생기고,
 * 색으로만 구분되는 상태가 된다. 높이 44px 는 터치 타깃 하한이다.
 */
export const ShareChannelButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 44px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.borderStrong};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    fill: currentColor;
  }
`;
