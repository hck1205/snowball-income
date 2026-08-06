import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';
import { CARD_RIBBON } from './tokens';

/* -------------------------------------------------------------------------- */
/* 매스트헤드 — 카드가 아니라 편집면                                             */
/* -------------------------------------------------------------------------- */

/**
 * 지면 머리 — **카드가 아니다.**
 *
 * 종전에는 둥근 상자(테두리 + 반경 20px) 안에 제목·리드·칩·CTA 가 전부 들어 있었다. 그 상자는
 * 아래 카드 30장과 같은 형태 언어라, 화면 맨 위가 "가장 큰 카드"로 읽히고 제목이 카드 제목이 됐다.
 * 여기서는 상자를 걷고 **상단 오로라 줄 + 하단 헤어라인** 사이의 편집면으로 되돌린다 —
 * 신문 매스트헤드의 문법이고, 아래의 카드·표와 형태가 겹치지 않는다.
 */
export const Masthead = styled.header`
  position: relative;
  display: grid;
  gap: ${space[4]};
  padding: clamp(28px, 4vw, 52px) 0 clamp(24px, 3vw, 36px);
  border-bottom: 1px solid ${color.border};

  /* 마스코트가 설 자리(오른쪽). 좁은 폭에서는 그림을 그리지 않으므로 여백도 돌려준다. */
  ${media.up('tablet')} {
    padding-right: clamp(180px, 22vw, 300px);
  }
`;

/**
 * 라이브러리의 마스코트 — **상자를 열어 종목을 꺼내는 하마**(2026-08-05 사용자 지시).
 *
 * 이 화면은 "정리해 둔 것을 꺼내 보는 곳"이라 그림도 상자다. 매스트헤드는 카드가 아니라 편집면이고
 * overflow 를 자르지 않으므로, 여기서는 히어로(PageHero)와 달리 크기 상한이 필요 없다.
 *
 * 🔴 **장식이다**(`alt=""`) — 제목이 이미 이 화면의 이름을 말한다.
 * ⚠ 오른쪽 아래 기준. 스펙 줄(수록 종목·카테고리…)과 같은 바닥선에 서야 머리 전체가 한 덩어리로 읽힌다.
 * ⚠ 820px 아래에서는 그리지 않는다 — 그 폭에서는 제목·리드가 전폭을 써야 한다.
 */
export const MastheadMascot = styled.img`
  position: absolute;
  right: 0;
  bottom: clamp(16px, 2vw, 28px);
  width: clamp(150px, 19vw, 260px);
  height: auto;
  pointer-events: none;
  user-select: none;

  ${media.down('tablet')} {
    display: none;
  }

  /* ⚠ 얇은 막대(6px)라 반경을 주지 않는다(radiusShape 가드 §②). 면이 아니라 이 앱의 시그니처 선이다. */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${CARD_RIBBON};
    border-radius: ${radius.pill};
    background: ${color.gradientAurora};
  }
`;

/**
 * 지면 제목.
 *
 * 🔴 종전 clamp 상한은 `5xl`(30.7px 실측)이었다 — 카드 심볼(2xl~3xl)과 겨우 한 단 차이라
 * 화면에 위계가 없었다. 상한을 한 단 더 올려 **제목 → 섹션 제목 → 카드 심볼**이 눈에 순서로 잡히게
 * 한다. 굵기로는 위계를 만들 수 없다(display 서체가 Bold 한 벌이라 600/700/800 이 같게 렌더된다).
 */
export const MastheadTitle = styled.h1`
  margin: 0;
  max-width: 20ch;
  font-size: clamp(${font.size['3xl']}, 5.2vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
`;

export const MastheadLede = styled.p`
  margin: 0;
  max-width: 54ch;
  font-size: clamp(${font.size.md}, 1.6vw, ${font.size.lg});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

/**
 * 라이브러리 스펙 줄 — **읽는 면**이다.
 *
 * 종전 요약은 "27종 수록 · 6개 카테고리" 한 줄이었다. 그건 목차의 정보이지 고르는 데 쓰는 정보가
 * 아니다. 여기서는 상세 페이지의 참고 지표(`SpecTable`)와 **같은 문법**(라벨 위 · 값 아래 ·
 * 칸 사이 헤어라인)으로 배당률 범위·월배당 종목 수까지 낸다 — 이 라이브러리가 무엇을 담고 있는지가
 * 숫자로 먼저 읽힌다.
 */
export const LibrarySpec = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0;
  border-top: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const LibrarySpecItem = styled.div`
  display: grid;
  gap: 4px;
  padding: ${space[3]} ${space[4]} ${space[3]} 0;
  border-bottom: 1px solid ${color.border};
  min-width: 0;
`;

export const LibrarySpecLabel = styled.dt`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${color.textMuted};
`;

/**
 * 스펙 값.
 *
 * 🔴 색은 **중립 고정**이다. 손익색(dataPositive/Negative)도 액센트도 여기 오지 않는다 —
 * 배당률 범위는 포지션이 아니라 사실이고, 색은 아래 카드·레일이 이미 충분히 말한다.
 */
export const LibrarySpecValue = styled.dd`
  margin: 0;
  font-size: clamp(${font.size.lg}, 1.8vw, ${font.size['2xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;
