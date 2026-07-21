import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, shadow, space } from '@/shared/styles';

/**
 * velog 글 카드 — 프리뷰 없이 제목부터 시작하는 콘텐츠 카드.
 * border 없이 그림자 + 서피스 밝기 사다리로 뜬다(전 프리셋 bg≠surface 실측 검증).
 * radius.xs(4px)는 의도적 — 도구 카드(radius.lg)와 구분되는 "콘텐츠 카드" 형태.
 * focus 링은 전역 a:focus-visible 규칙을 그대로 쓴다(여기서 outline을 건드리지 않는다).
 */
export const CardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: ${space[4]} ${space[4]} 0; /* 하단 0 — 푸터가 자체 패딩을 갖는다 */
  border-radius: ${radius.xs};
  background: ${color.surface};
  box-shadow: ${shadow.e1};
  overflow: hidden;
  text-decoration: none;
  color: inherit;

  /* 모션 축소 사용자에게도 hover 피드백은 남긴다 — 이동 없이 그림자 변화만. */
  &:hover {
    box-shadow: ${shadow.e3};
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: transform ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease};

    &:hover {
      transform: translateY(-8px);
    }
  }
`;

/**
 * 시뮬 프리뷰 블록(스펙 §E2) — velog 썸네일 슬롯에 숫자를 얹는다. CardLink의 패딩을 음수 마진으로
 * 상쇄해 full-bleed. 조용한 판(surfaceSunken) 위에 숫자가 색 없이 서게 한다 — 그라데이션·brand 채움 금지.
 * hover 시 블록 자체는 그대로(카드 전체의 그림자/이동만 반응한다).
 */
export const PreviewBlock = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 132px;
  margin: -${space[4]} -${space[4]} ${space[3]};
  padding: ${space[4]};
  background: ${color.surfaceSunken};
  border-bottom: 1px solid ${color.border};
`;

export const CardTitle = styled.h3`
  margin: 0 0 ${space[2]};
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardSummary = styled.p`
  margin: 0 0 ${space[3]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/** 서브 정보 한 줄: "3일 전 · 댓글 2 · 조회수 41" | (있으면) 시뮬 배지. */
export const SubInfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  margin-top: auto; /* 요약이 짧아도 서브 정보~푸터를 카드 바닥에 고정 */
  padding-bottom: ${space[3]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const SubInfoText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
`;

/** 푸터 — 구분선을 카드 전폭으로 그리기 위해 좌우 패딩을 음수 마진으로 상쇄한다. */
export const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  margin: 0 -${space[4]};
  padding: ${space[3]} ${space[4]};
  border-top: 1px solid ${color.border};
`;

/** 푸터 작성자 — 아바타·"by" 접두어 없이 닉네임만(사용자 지시, 2026-07-17). */
export const FooterAuthor = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};

  b {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/** 푸터 우측 액션 묶음 — 좋아요 스탯(표시) + 공유 버튼(상호작용)을 한 그룹으로 오른쪽에 둔다. */
export const FooterActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;
`;

/** ♥ + 좋아요 수 — 중립 텍스트 색 유지(데이터 방향색·danger 아님). */
export const LikeStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  ${font.numeric}

  svg {
    flex: 0 0 auto;
  }
`;
