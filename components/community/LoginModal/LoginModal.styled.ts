import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

export const Subtitle = styled.p`
  margin: 0 0 ${space[4]};
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
`;

export const ProviderList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

/** 두 프로바이더 모두 중립 톤 버튼. 브랜드 규정색은 로고(아이콘)로만 식별한다. */
export const ProviderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  width: 100%;
  min-height: 44px;
  padding: 0 ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const GoogleMark = styled.svg`
  flex: 0 0 auto;
`;

/** 카카오 심볼은 텍스트 색(currentColor)을 따른다 — 규정 노랑을 임의로 넣지 않는다. */
export const KakaoMark = styled.svg`
  flex: 0 0 auto;
  color: ${color.text};
`;

/** 네이버 심볼 — 규정 그린(#03C75A) 사각형 + 흰 "N". 색을 path에 직접 박아 테마와 무관하게 브랜드색을 유지한다. */
export const NaverMark = styled.svg`
  flex: 0 0 auto;
`;

/**
 * 네이버 버튼 클릭 시 노출되는 인라인 안내(준비 중). 크래시 대신 graceful 안내.
 * 렌더 측에서 role="status" + aria-live로 스크린리더에 부드럽게 알린다.
 */
export const ProviderNotice = styled.p`
  margin: ${space[3]} 0 0;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  background: ${color.surfaceHover};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  text-align: left;
`;
