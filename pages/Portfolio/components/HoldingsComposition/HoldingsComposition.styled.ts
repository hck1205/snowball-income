import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 비중 도넛 + 범례.
 *
 * 🔴 **도넛 지름은 148px 로 고정한다.** `tintscan` 의 면 판정은 폭 ≥180px **AND** 높이 ≥8px 이라
 * 148px 원은 색이 가득 차 있어도 면으로 세어지지 않는다 — 이 화면의 틴트 면 예산(2)은 히어로와
 * 상태 줄이 이미 쓰고 있어 여유가 없다. 커지고 싶으면 예산을 먼저 내려라(올리는 방향은 금지).
 */
/**
 * ⚠ `flex-wrap: wrap` 은 2026-08-03 리워크의 요구다 — 이 블록이 이제 폭 300~380px 짜리 **답 레일**
 * 안에 선다. 좁은 폭에서 도넛과 범례가 나란히 못 서면 범례가 도넛 아래로 내려간다.
 *
 * ## 2026-08-03 검증에서 잡은 결함 — 세로로 쌓으면 범례가 **잘려서 안 보인다**
 * 답 레일은 `position: sticky` + `max-height: 100vh - 헤더` + `overflow-y: auto` 다. 도넛(148) 위에
 * 범례(128)를 쌓으면 이 블록만 304px 이 되고, 요약 카드 전체가 949px 이 되어 1280×900 에서
 * **170px 이 레일 안쪽 스크롤 밖으로 밀린다** — 밀려나는 것이 하필 범례 전부라(제목 + 5줄)
 * 도넛이 이름표 없는 색 원판으로 보였다(실측: `종목별 비중`·`SCHY`·`DGRO`… 전부 clipped).
 *
 * 그래서 **레일이 존재하는 구간에서만** 나란히 세운다. 여기서 미디어 쿼리가 정당한 이유:
 * 이 블록의 소비처는 요약 카드 **한 곳**이고, 요약 카드가 좁은 레일에 서는 조건은
 * `PortfolioPage/styled` 의 작업대 2열 전환과 **같은 경계**(`media.up('headerStack')` = 1024px)다.
 * 1024px 미만은 1열이라 이 블록이 카드 전폭을 쓴다 — 두 상태가 폭으로 갈리지 않는다.
 * 🔴 요약 카드를 다른 곳에서도 쓰게 되면 이 전제가 깨진다. 그때는 컨테이너 쿼리로 옮겨라.
 */
export const CompositionRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
  padding-top: ${space[1]};

  ${media.up('headerStack')} {
    flex-wrap: nowrap;
    gap: ${space[3]};
  }

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * 🔴 지름은 두 값뿐이다 — 1열에서는 148px, **답 레일(≥1024px)에서는 110px**.
 * 레일 안 가용폭은 1024px 기준 약 254px(레일 300 − 카드 좌우 여백 40 − 스크롤바 6)이라
 * 148 + 12 + 범례가 서지 못한다. 110 + 12 + 132 = 254 로 **딱 맞춘 값**이다.
 * ⚠ 어느 쪽도 `tintscan` 면 판정(폭 ≥180)에 걸리지 않는다 — 180px 이상으로 키우지 마라.
 */
export const DonutFrame = styled.div`
  flex: 0 0 auto;
  position: relative;
  width: 148px;
  height: 148px;
  align-self: center;

  ${media.up('headerStack')} {
    width: 110px;
    height: 110px;
  }
`;

/**
 * 색 원판. 가운데는 `mask` 로 뚫는다 — 위에 면색 원을 얹으면 그 원이 부모 카드의 배경색을
 * 따라가지 못해(요약 카드는 `surfaceRaised`) 다크에서 가운데만 다른 밝기로 뜬다.
 * `mask` 미지원 브라우저에서는 채운 원(파이)이 되고, 뜻은 그대로 읽힌다.
 */
export const DonutDisc = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  mask: radial-gradient(circle, transparent 58%, currentColor 58.5%);
  -webkit-mask: radial-gradient(circle, transparent 58%, currentColor 58.5%);
`;

/** 도넛 한가운데의 보유 종수. 도넛이 장식이라도 그 안의 숫자는 사실이라 글자로 남긴다. */
export const DonutCenter = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  text-align: center;
  pointer-events: none;
`;

export const DonutCenterValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric}
`;

export const DonutCenterLabel = styled.span`
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

export const LegendBlock = styled.div`
  /* 기준 190px — 이보다 좁아지면 flex-wrap 이 이 블록을 도넛 아래로 내린다(1열 구간). */
  flex: 1 1 190px;
  min-width: 0;
  display: grid;
  gap: ${space[2]};

  /* 레일 구간에서는 줄바꿈이 없다 — 기준을 좁혀 도넛 옆에 세운다(이름은 원래 말줄임된다). */
  ${media.up('headerStack')} {
    flex: 1 1 132px;
  }
`;

export const LegendTitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const LegendList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

/** 범례 한 줄 — 점 · 이름 · (선) · 값. 값은 우측 정렬 + tabular 라 세로로 자릿수가 맞는다. */
export const LegendItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
`;

/** 10px 점 — 폭·높이 모두 면 하한 밖이다. 색은 표의 종목 귀와 **같은 값**이다. */
export const LegendDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: ${radius.pill};
`;

export const LegendName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const LegendValue = styled.span`
  text-align: right;
  color: ${color.textSecondary};
  white-space: nowrap;
  ${font.numeric}
`;
