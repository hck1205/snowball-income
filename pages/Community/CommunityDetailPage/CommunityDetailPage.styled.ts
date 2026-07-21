import styled from '@emotion/styled';
import { color, font, motion, radius, shadow, space, zIndex } from '@/shared/styles';

export const Article = styled.article`
  max-width: 760px;
  margin: 0 auto;
  display: grid;
  gap: clamp(${space[4]}, 3vw, ${space[6]});
`;

/**
 * 본문 카드 — 제목·메타·본문·첨부 CTA·좋아요를 배경(bg) 위로 띄우는 surface 패널.
 * 갤러리 velog 카드와 같은 디자인 언어(surface 면색 + 은은한 테두리 + shadow.e1, 콘텐츠 카드 radius.xs).
 * 배경과 색이 비슷해 밋밋하던 읽기 페이지에 대비·계층·여백을 준다(구조는 그대로).
 */
export const PostCard = styled.div`
  display: grid;
  gap: ${space[5]};
  padding: clamp(${space[5]}, 4vw, ${space[8]});
  border-radius: ${radius.xs};
  border: 1px solid ${color.border};
  background: ${color.surface};
  box-shadow: ${shadow.e1};
`;

/**
 * 댓글 카드 — 댓글 영역도 같은 surface 패널로 본문 카드와 분리해 띄운다.
 * CommentSection 루트(`<section>`)는 본문과 분리하려 자체 top divider(margin/padding/border-top)를 갖는데,
 * 카드 경계가 그 분리를 대신하므로 카드 안에서는 상쇄한다(자기 요소 선택자 — Emotion 컴포넌트 셀렉터 아님).
 */
export const CommentsCard = styled.div`
  padding: clamp(${space[5]}, 4vw, ${space[8]});
  border-radius: ${radius.xs};
  border: 1px solid ${color.border};
  background: ${color.surface};
  box-shadow: ${shadow.e1};

  & > section {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
`;

export const DetailHeader = styled.header`
  display: grid;
  gap: ${space[3]};
  padding-bottom: ${space[4]};
  border-bottom: 1px solid ${color.border};
`;

export const HeaderTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const Title = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: clamp(${font.size['2xl']}, 4vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  word-break: break-word;
`;

export const OwnerActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  b {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }

  time {
    color: ${color.textMuted};
  }

  .views {
    color: ${color.textMuted};
    ${font.numeric}
  }
`;

export const Dot = styled.span`
  color: ${color.textMuted};
`;

/**
 * 첨부 유닛 — "시뮬레이션 열기" CTA(위)와 시나리오 미리보기 아코디언(아래)을 **하나의 카드**로 묶는다.
 * 단일 surface/테두리/radius를 이 컨테이너가 소유하고(overflow로 상·하단 모서리를 클립),
 * 안의 CTA 배너와 아코디언은 각자의 테두리·radius를 갖지 않아 seam 없이 위–아래로 이어진다.
 */
export const AttachUnit = styled.div`
  border-radius: ${radius.lg};
  border: 1px solid ${color.brandBorder};
  background: ${color.surfaceSunken};
  overflow: hidden;
`;

/** 유닛 상단 CTA 배너 — 자체 테두리·radius 없이(유닛이 소유) brand 틴트 배경 밴드로만 선다. */
export const AttachCta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding: ${space[4]} ${space[5]};
  background: ${color.brandSubtle};
`;

export const AttachCtaInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.md};
    font-weight: ${font.weight.bold};
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

export const LikeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
`;

/**
 * 공유 버튼 — 좋아요(LikeButton)와 같은 pill 시각 언어(중립 테두리 + surface 면색).
 * hover/focus만 brand 강조로 상호작용을 알린다.
 */
export const ShareButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  height: 36px;
  padding: 0 ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
    color: ${color.brand};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  svg {
    flex: 0 0 auto;
  }
`;

/** 복사 폴백 토스트 — 배경/글자색은 토큰(다크에서도 대비 안전). TickerCreation 토스트와 동일 언어. */
export const ShareToast = styled.div`
  position: fixed;
  top: ${space[4]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  max-width: min(92vw, 420px);
  background: ${color.text};
  color: ${color.surface};
  border-radius: ${radius.sm};
  padding: ${space[3]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  box-shadow: ${shadow.e3};
  word-break: break-all;
`;

export const StateWrap = styled.div`
  max-width: 480px;
  margin: clamp(${space[6]}, 8vw, ${space[16]}) auto 0;
`;

export const BannerAction = styled.div`
  margin-top: ${space[3]};
`;
