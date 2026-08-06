import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  appHeaderHeight,
  cardElevation,
  color,
  font,
  media,
  motion,
  radius,
  space
} from '@/shared/styles';
import { scrollRail } from './motion';

/* -------------------------------------------------------------------------- */
/* 리더 레일(목차) — 데스크톱 사이드바 / 모바일 sticky 가로바                       */
/* -------------------------------------------------------------------------- */

/**
 * 리더 레일 — 종전 "목차"의 자리지만 하는 일이 다르다.
 *
 * 종전 목차는 **본문 장만** 담아 문서의 앞 60%만 가리켰다(참고 지표·FAQ·관련 티커로 내려가면
 * 활성 표시가 마지막 장에 멈춰 있었다). 이제 부록까지 담고, 장에는 번호가 붙고, 맨 아래에
 * 상시 CTA 가 붙어 긴 문서 어디에서도 다음 행동이 한 화면 안에 있다.
 */
export const TocAside = styled.nav`
  position: sticky;
  /* 데스크톱 사이드바 — 앱 헤더 **실측 높이** + 약간의 여백 아래에 붙는다(AppHeader 가 발행). */
  top: calc(${appHeaderHeight} + ${space[3]});
  align-self: start;
  min-width: 0;

  ${media.down('layout')} {
    position: sticky;
    /* ⚠ 앱 헤더 높이에 정확히 맞물린다 — 하드코딩(구 57px·88px)은 헤더 줄 수가 바뀔 때마다 어긋나
       헤더와 이 목차 바 사이에 빈 띠(갭)를 만들었다. 이제 실측값이라 항상 딱 붙는다. */
    top: ${appHeaderHeight};
    z-index: 5;
    padding: ${space[2]} 0;
    background: ${color.surfaceGlassFallback};
    border-bottom: 1px solid ${color.border};
  }

  ${media.up('layout')} {
    position: sticky;
    display: grid;
    gap: ${space[3]};
    padding: ${space[4]};
    border-radius: ${DATA_RADIUS};
    ${cardElevation('base')}
    overflow: hidden;

    /*
     * 읽은 분량 진행 레일 — 문서 스크롤 진행도에 매인다(JS 0). 레일 왼쪽 끝에 붙어 자란다.
     * ⚠ 얇은 막대라 반경을 주지 않는다(radiusShape §②). 미지원 브라우저에서는 그냥 꽉 찬 레일.
     */
    &::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--tk-gradient);
      transform-origin: 0 0;

      @supports (animation-timeline: scroll(root block)) {
        animation: ${scrollRail} linear both;
        animation-timeline: scroll(root block);
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    }
  }
`;

/** 레일 머리 — "목차" 라벨 + 장 수. 모바일 가로바에서는 자리를 먹으므로 숨긴다. */
export const TocHead = styled.p`
  margin: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${color.textMuted};

  ${media.down('layout')} {
    display: none;
  }
`;

export const TocCount = styled.span`
  letter-spacing: 0;
  text-transform: none;
  color: ${color.textSecondary};
  ${font.numeric};
`;

export const TocList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1px;

  ${media.down('layout')} {
    /* 가로 스크롤 대신 줄바꿈 — 좁은 화면에서 목차 칩이 여러 줄로 접혀 전부 보인다(사용자 요청). */
    display: flex;
    flex-wrap: wrap;
    gap: ${space[1]};
  }
`;

/** 부록 항목 앞의 구분선 — 본문 장과 부록이 한 목록 안에서 갈린다(글자 크기가 아니라 선으로). */
export const TocDivider = styled.li`
  height: 1px;
  margin: ${space[2]} 0;
  background: ${color.border};

  ${media.down('layout')} {
    display: none;
  }
`;

/**
 * 목차 항목.
 *
 * 데스크톱은 **번호 + 라벨 2열**이고, 활성 항목만 액센트 면을 입는다(폭 <180px 라 면으로 세어지지
 * 않는다). 모바일은 같은 요소가 줄바꿈 칩이 된다 — 형태가 둘이라 각자의 규칙이 있다.
 */
export const TocButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: baseline;
  gap: ${space[2]};
  text-align: left;
  border: none;
  cursor: pointer;
  padding: 7px ${space[2]};
  border-radius: ${radius.sm};
  background: ${({ $active }) => ($active ? 'var(--tk-active-bg)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--tk-text)' : color.textSecondary)};
  font-size: ${font.size.sm};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.medium)};
  line-height: ${font.leading.snug};
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--tk-active-bg)' : color.surfaceHover)};
    color: ${({ $active }) => ($active ? 'var(--tk-text)' : color.text)};
  }

  ${media.down('layout')} {
    /* 줄바꿈 칩 — 내용 폭으로 줄어 한 줄에 여러 개가 들어가고 넘치면 다음 줄로 접힌다.
       (base의 width:100%를 auto로 풀지 않으면 flex 자식이 줄을 통째로 차지해 세로로만 쌓인다.)

       ⚠ 이 바는 **sticky** 다 — 줄이 늘면 늘어난 만큼 화면이 영구히 좁아진다. 부록 4항목이
       목차에 들어오면서 390px 에서 3줄이 됐고, 그만큼 본문이 밀렸다. 그래서 모바일 칩만
       한 단 작게(12px·좁은 패딩) 잡아 두 줄 대역으로 되돌린다. */
    width: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    padding: 3px ${space[2]};
    font-size: ${font.size.xs};
    border-radius: ${radius.pill};
    border: 1px solid ${({ $active }) => ($active ? 'var(--tk-solid)' : color.border)};
  }
`;

/** 장 번호. 등폭 숫자라 세로로 줄이 선다 — 번호가 곧 문서의 뼈대다. */
export const TocIndex = styled.span<{ $active: boolean }>`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0;
  color: ${({ $active }) => ($active ? 'var(--tk-text)' : color.textMuted)};
  ${font.numeric};
`;

/** 부록 항목의 표식 — 번호 자리에 서는 점(장이 아니라는 뜻을 모양으로 말한다). */
export const TocDot = styled.span<{ $active: boolean }>`
  justify-self: center;
  width: 5px;
  height: 5px;
  border-radius: ${radius.pill};
  background: ${({ $active }) => ($active ? 'var(--tk-solid)' : color.borderStrong)};

  ${media.down('layout')} {
    width: 4px;
    height: 4px;
  }
`;

export const TocLabel = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

/**
 * 레일 바닥의 상시 CTA — 긴 문서 어디에서도 다음 행동이 한 화면 안에 있다.
 * 🔴 데스크톱 전용이다. 모바일에서 sticky 가로바에 버튼을 더하면 헤더 아래 띠가 두 줄이 된다.
 */
export const TocCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid var(--tk-border);
  background: transparent;
  color: var(--tk-text);
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: var(--tk-soft);
  }

  ${media.down('layout')} {
    display: none;
  }
`;
