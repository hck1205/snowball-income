import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  motion,
  pressTransition,
  pressable,
  radius,
  shadow,
  space
} from '@/shared/styles';

/**
 * 페이지를 닫는 줄 — **중립 카드 + 상단 6px 브랜드 레일**이다.
 *
 * ## 🔴 왜 네이비 패널이 아닌가 (2026-08-03, 실측으로 뒤집은 결정)
 * 개편안(D3)은 `brandPanel()` 을 **마무리 CTA 와 푸터 둘 다**에 처방하면서 같은 문서에서 랜딩의
 * 틴트 면을 **2**(기준선 유지)로 적었다. 그 산술이 맞지 않는다 — 실측하면 히어로 그라디언트 ①,
 * 이 줄의 네이비 패널 ②, `PageFooter` 의 네이비 패널 ③ 으로 **3/2 초과**다
 * (`node tools/dev/tintscan.mjs --route / --width 1280,390` 이 1280·390 양쪽에서 exit 1).
 *
 * 기준선 2 는 확정 결정이고 **올릴 수 없다**(`tools/dev/tintscan.mjs` DEFAULT_SCENARIOS). 그래서
 * 셋 중 하나가 면을 내놓아야 했고, 내놓은 것이 여기다:
 *  - 히어로는 접힘 위 유일한 브랜드 면이라 못 뺀다(면 ①).
 *  - 푸터 패널은 **전 라우트에 서는 셸**이고 이 폴더 밖(`components/common/PageFooter`)이다.
 *  - 그리고 눈으로 봐도 그게 맞다 — 실측 @1280 에서 이 줄(y=3650)과 푸터(y=3846)는 **76px 사이로
 *    같은 네이비가 두 번** 서 있었다. 브랜드가 강해지는 게 아니라 같은 말을 두 번 하는 것이다.
 *
 * 그래서 마무리 줄은 **푸터로 들어가는 진입 경사**가 된다: 중립 면 + 브랜드 레일 + 브랜드 배지 +
 * 오로라 CTA → 바로 아래에서 네이비·금색 푸터가 페이지를 닫는다. 색은 줄지 않고 **한 번만** 선다.
 *
 * 🔴 **금색을 여기 쓰지 마라.** 금색은 `brandPanel()` 이 깐 네이비 면 위에서만 합법이고
 * (밝은 면 위 1.83:1), 이 줄은 더 이상 그 면이 아니다. `contrast.test.ts` 가 잡는다.
 * ⚠ 푸터가 다시 중립으로 돌아가면 이 줄을 `brandPanel()` 로 되돌릴 여지가 생긴다 — 그때는
 *   **되돌리기 전에 tintscan 을 다시 돌려라.** 이 주석이 그 조건을 적어 두는 자리다.
 *
 * 🔴 **헤딩이 없다.** 여기에 h2 를 주면 문서의 h2 순서 계약(랜딩 구조 테스트)이 깨지고, "질문"도
 * "장"도 아닌 것이 목차에 들어간다. 이 줄은 마지막 액션이지 챕터가 아니다.
 *
 * ⚠ **DOM 계약**: 마무리 CTA 앵커의 `parentElement` 가 이 요소여야 하고, 이 요소가 갖는 **첫 `p`**
 *   가 닫는 문장이어야 한다(`test/landing/landingClosingCta.test.tsx`). 사이에 래퍼를 끼우지 마라.
 */
export const ClosingRow = styled.div`
  ${cardElevation('base')}
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: clamp(16px, 2.4vw, 28px);
  min-width: 0;
  /* 레일이 3변으로 붙으려면 모서리에서 잘라야 한다. */
  overflow: hidden;
  padding: clamp(20px, 3vw, 32px);
  /* 고르는 면(PickCard·체크리스트)과 같은 반경 대역 — 페이지 끝에서 각이 갈리면 눈에 띈다. */
  border-radius: ${PICK_RADIUS};

  /* 상단 브랜드 레일. 의사요소라 DOM 열거 대상이 아니고, 6px 은 면 하한(8px)에도 못 미친다. */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${PICK.railHeight};
    background: ${color.brand};
  }
`;

/**
 * 하마 배지 — 브랜드가 **본문에서 직접 말하는 그림**이다.
 *
 * 면·글자 모두 brand 축이다(`brand-subtle` 면 + `brand-text` 잉크). 두 토큰의 쌍은
 * `contrast.test.ts` 가 16테마 전부에서 재는 정식 조합이라 여기서 새로 검증할 값이 없다.
 * 폭 56px 은 `tintscan` 의 면 하한(180px)에 한참 못 미쳐 **면으로 세어지지 않는다.**
 *
 * ⚠ 금화(`accent` prop)는 켜지 않는다 — 금화는 currentColor 로 그려지고, 금색은 네이비 패널
 *   위에서만 합법이다. 이 자리에서 켜면 "금화"가 아니라 브랜드색 원 하나가 될 뿐이다.
 */
export const ClosingMark = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  border-radius: ${radius.lg};
  color: ${color.brandText};
  background: ${color.brandSubtle};
`;

/** 그림 + 문장 한 덩어리. 좁은 폭에서 문장이 그림 아래로 내려가지 않게 묶는다. */
export const ClosingLead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[4]};
  flex: 1 1 320px;
  min-width: 0;
`;

export const ClosingNote = styled.p`
  margin: 0;
  min-width: 0;
  /* 페이지의 **마지막 문장**이라 본문이 아니라 제목의 어법으로 선다(섹션 제목과 같은 display 서체).
     상한 20px 은 섹션 제목(18px)보다 한 단 위다 — 여기가 문서의 끝이라는 신호다. */
  font-family: ${font.display};
  font-size: clamp(${font.size.lg}, calc(0.55rem + 0.9vw), ${font.size['2xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  line-height: ${font.leading.snug};
  /* 중립 면으로 내려왔으므로 본문 텍스트 축이다(text / surface 는 전 테마 AA 정식 쌍). */
  color: ${color.text};
  word-break: keep-all;
`;

/**
 * 마지막 액션 — **히어로의 1순위 CTA 와 같은 모양**이다(오로라 채움 + on-brand 라벨).
 *
 * 같은 곳으로 가는 같은 라벨의 버튼이 페이지 위아래에서 다르게 생기면, 사용자는 그 둘을 서로
 * 다른 행동으로 읽는다. 그래서 `gradientCta` 를 그대로 쓴다 — 모든 stop 에서 흰 라벨 ≥4.5:1 임이
 * 이미 검증된 채움이다(`components/common/Button/Button.styled.ts` primary).
 *
 * 🔴 **호버에 filter 를 걸지 마라.** brightness() 는 라벨까지 함께 밀어 대비를 **내린다**
 * (실측 aurora/light 4.84 → 4.46 등 전부 AA 미달). 원인이 토큰이 아니라 CSS 필터라
 * contrast.test.ts 가 원리적으로 못 본다. 그래서 호버는 **색을 바꾸지 않고** 그라디언트 위치만
 * 움직인다 — 어느 순간에도 라벨 대비가 불변이다(primary 버튼이 세워 둔 방식 그대로).
 * ⚠ 누를 수 있는 것은 `tintscan` 이 면으로 세지 않는다(액션이지 면이 아니다) — 이 채움은
 *   예산과 무관하다. flex: 0 0 auto 는 전폭으로 늘어나 문장 아래로 떨어지지 않게 하는 것이다.
 */
export const ClosingLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
  height: 48px;
  padding: 0 ${space[5]};
  border-radius: ${radius.pill};
  background-image: ${color.gradientCta};
  background-size: 160% 160%;
  background-position: 0% 0%;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.onBrand};
  text-decoration: none;
  transition: background-position ${motion.base} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease},
    ${pressTransition};
  ${pressable}

  &:hover {
    background-position: 100% 100%;
    box-shadow: ${shadow.e2};
  }
`;
