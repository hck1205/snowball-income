/**
 * 가로로 미는 상자의 **공통 처방** — 끝을 흐려 "더 있다"를 말하고, 첫 열을 붙여 맥락을 지킨다.
 *
 * 이 파일은 2026-08-07 에 **중복에서 추출**했다. 같은 처방이 세 곳에 리터럴로 복사돼 있었다
 * (`components/MarketIndexStrip` · 배당 목록 비교표 · 대가 순위표). 값이 24px 인지 28px 인지,
 * 왼쪽도 흐리는지 같은 판단이 파일마다 갈리기 시작하면 같은 종류의 상자가 화면마다 다르게
 * 움직인다 — 이 레포가 여러 번 겪은 형태다.
 */

import { color, radius, space } from './tokens';

/** 흐려지는 폭. 원본(MarketIndexStrip)의 값을 그대로 쓴다 — 셋이 이미 이 값에 맞춰져 있었다. */
const FADE = '24px';

/**
 * 넘칠 때 **오른쪽 가장자리를 흐린다** — 스크롤바 없이도 "여기서 이어진다"를 말한다.
 *
 * 🔴 `mask-image` 라 **색을 쓰지 않는다.** 프리셋 8종 × 라이트/다크와 무관하게 같은 결과가 나오고,
 * 대비 게이트(`shared/styles/contrast.test.ts`)의 대상도 아니다. 배경 그라디언트로 같은 효과를
 * 내려면 상자 뒤 면색을 알아야 하는데, 이 상자들은 서로 다른 면 위에 선다.
 *
 * ⚠ 마스크는 상자에 붙박이라 **끝까지 밀어도 흐림이 남는다.** "다 봤다"까지 말하려면 스크롤 위치를
 *   읽어야 한다 — 그 대신 얻는 것이 "색과 무관하게 동작한다"이고, 이 레포는 그 거래를 지수 띠에서
 *   먼저 택했다. 바꾸려면 세 소비처를 **함께** 바꿔라(그래서 이 파일이 있다).
 * ⚠ 왼쪽은 흐리지 않는다. 이 상자들의 왼쪽 끝에는 고정 열이 자기 면으로 덮고 있거나(아래
 *   `stickyColumn`) 흐릴 것이 없다.
 */
export const scrollFadeRight = `
  mask-image: linear-gradient(to right, #000 calc(100% - ${FADE}), transparent);
`;

/**
 * 🔴 **표의 셀을 고정하려면 이 표는 `border-collapse: separate` 여야 한다.**
 *
 * Chrome 은 `border-collapse: collapse` 인 표의 셀에 `position: sticky` 를 **아예 적용하지 않는다**
 * (오래된 알려진 제약). 선언은 멀쩡히 들어가 있고 아무 일도 일어나지 않기 때문에, 원인이 셀이
 * 아니라 **표**에 있다는 것을 눈치채기가 대단히 어렵다 — 2026-08-07 에 목록 비교표와 대가
 * 순위표에서 같은 함정을 한꺼번에 밟았다.
 *
 * ⚠ separate 로 바꾸면 `tr` 에 준 `border` 가 그려지지 않는다(collapse 때는 표가 대신 그려 줬다).
 *   줄 사이 선은 **칸(td/th)** 으로 옮겨야 한다.
 * ⚠ `border-spacing: 0` 이 없으면 칸 사이가 벌어져 collapse 때와 다른 모양이 된다.
 */
export const stickyCellTable = `
  border-collapse: separate;
  border-spacing: 0;
`;

/**
 * 가로로 미는 동안 **제자리에 남는 열**.
 *
 * 🔴 `background` 가 반드시 있어야 한다. 고정 칸은 다른 칸 **위로** 지나가는데, 배경이 없으면
 * 밀려오는 글자가 그 밑에서 비쳐 두 줄이 겹쳐 보인다.
 * 🔴 오른쪽 경계선을 `border-right` 가 아니라 `box-shadow: inset` 으로 그린다 — 표의 테두리는
 * 주인이 표라서 고정된 칸의 border 는 함께 밀려간다.
 *
 * @param left 이 열이 붙는 위치. 두 번째 고정 열이면 앞 열의 폭을 넘긴다.
 * @param divider 오른쪽 경계선을 그릴지. 고정 구간의 **마지막 열에만** 참이어야 한다 —
 *                중간 열까지 그리면 고정 구간 안에 선이 여러 개 생겨 열이 갈라져 보인다.
 */
export const stickyColumn = (left = '0', divider = false) => `
  position: sticky;
  left: ${left};
  z-index: 1;
  background: ${color.surface};
  ${divider ? `box-shadow: inset -1px 0 ${color.border};` : ''}
`;

/**
 * **누를 수 있는 것처럼 생긴 알약 칩** — 옅은 브랜드 면 + 테두리 + 둥근 모서리.
 *
 * 이 레포에서 알약은 이미 "누르는 것"의 모양이다(캘린더 칩·필터 칩). 그래서 표 안의 링크처럼
 * 글자 하나가 목적지인 자리에는 이 모양을 쓴다 — 브랜드색 글자 + **호버에만** 나오는 밑줄은
 * 모바일에서 아무 표시도 없는 것과 같고(호버가 없다), 색 단독 채널이라 색각 이상에서도 사라진다.
 *
 * 2026-08-07 에 미국 의원(TickerLink)·한국 의원(IssuerLink) 두 곳에 같은 선언을 적었다가 합쳤다.
 * ⚠ 크기·서체는 소비처가 정한다 — 이 묶음은 **면과 모양**만 말한다.
 */
export const brandPillLink = `
  display: inline-block;
  padding: 1px ${space[2]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: ${color.brandSubtleHover};
  }
`;
