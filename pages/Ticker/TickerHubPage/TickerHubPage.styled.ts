import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/** 상세 페이지(TickerDetailPage.styled)와 결을 맞춘 등장 키프레임 — 은은한 상승(blur는 사용자 요청으로 제거). */
const revealIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 40px, 0) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

export const HubHero = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: clamp(24px, 4vw, 40px);
  border-radius: ${radius.xl};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: ${color.gradientAurora};
  }
`;

export const HubTitle = styled.h1`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 4vw, ${font.size['5xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const HubLede = styled.p`
  margin: 0;
  font-size: clamp(${font.size.md}, 2vw, ${font.size.xl});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  max-width: 56ch;
`;

/** 카테고리 점프 내비 — 허브에도 목차 성격의 카테고리 이동을 둔다. */
export const CategoryNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[2]};
`;

export const CategoryNavLink = styled.a`
  display: inline-flex;
  align-items: center;
  padding: ${space[1]} ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surface};
  border: 1px solid ${color.border};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  text-decoration: none;

  &:hover {
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;

export const CategorySection = styled.section`
  scroll-margin-top: 80px;
  margin-top: clamp(28px, 4vw, 44px);
  display: grid;
  gap: ${space[4]};

  /*
   * scroll-driven 리빌 — 카테고리 블록이 스크롤 진입 진행도에 매여 안착한다(상세 페이지와 결 맞춤).
   * 블록 단위라 안쪽 카드의 hover translateY 와 충돌하지 않는다. 미지원 브라우저는 정적 표시(우아한 폴백 —
   * 허브는 원래 리빌이 없었으므로 퇴화가 아니다). JS 트리거가 없어 fallback 도 없다.
   */
  @supports (animation-timeline: view()) {
    animation-name: ${revealIn};
    animation-fill-mode: both;
    animation-timing-function: ease-out;
    animation-timeline: view();
    animation-range: entry 0% cover 38%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const CategoryHeading = styled.h2`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const CategoryCount = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[4]};

  ${media.down('tablet')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const TickerCard = styled(Link)`
  /* 카드 폭 기준 컨테이너 — 좁은 카드에서 심볼/스탯 폰트를 cqi 로 유동 축소한다(상세 HeroStat 와 결 맞춤). */
  container-type: inline-size;
  display: grid;
  /* 내부 열을 셀에 묶는다(auto 열이 max-content=긴 영문명/소개 한 줄로 커져 카드를 뷰포트 밖으로 밀던 주범). */
  grid-template-columns: minmax(0, 1fr);
  /* 그리드 셀 안에서 카드 자신이 줄어들 수 있게(없으면 min-content 가 커서 축소 불가 → ellipsis 도 안 먹는다). */
  min-width: 0;
  gap: ${space[3]};
  padding: ${space[5]};
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
  background: ${color.surface};
  text-decoration: none;
  transition: transform ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    transform: translateY(-2px);
    border-color: ${color.brandBorder};
  }
`;

export const CardHead = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const CardTicker = styled.span`
  font-size: clamp(20px, 7cqi, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/** 한글명 · 영문명 — 좁은 폭에서 길어지면 한 줄 말줄임(…)으로 카드를 넘기지 않는다. */
export const CardKorean = styled.span`
  min-width: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 한 줄 소개 — 최대 2줄까지 보여주고 넘치면 말줄임(정보 과잉 은닉 없이 카드 높이만 고정). */
export const CardTagline = styled.p`
  margin: 0;
  min-width: 0;
  font-size: ${font.size.md};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardStatRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[4]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const CardStat = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const CardStatLabel = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const CardStatValue = styled.span`
  font-size: clamp(13px, 4.6cqi, ${font.size.lg});
  font-weight: ${font.weight.bold};
  color: ${color.brandText};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

export const EmptyState = styled.p`
  margin-top: ${space[6]};
  padding: ${space[6]};
  border-radius: ${radius.lg};
  border: 1px dashed ${color.border};
  text-align: center;
  color: ${color.textMuted};
  font-size: ${font.size.md};
`;
