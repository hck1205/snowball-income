import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { PICK_RADIUS, color, font, motion, pressTransition, pressable, radius, shadow, space } from '@/shared/styles';

/**
 * 페이지를 닫는 줄 — **랜딩의 유일한 밝은 틴트 면**(brand-subtle)이다.
 *
 * ## 🔴 왜 여기가 면을 갖게 됐나 (2026-08-03, 흰 캔버스 전환이 만든 예산 한 장)
 * 종전 장부는 ①히어로 그라디언트 ②푸터 네이비 패널로 **2/2** 였고, 그래서 이 줄은 면을 못 갖고
 * 중립 카드 + 6px 레일로 살았다(그 산술의 원본 근거는 아래 "네이비가 아닌 이유"에 남긴다).
 * 사용자 결정으로 히어로 배경이 파스텔 램프에서 **흰 면**이 되면서 면 ①이 사라졌다 —
 * 예산이 한 장 풀렸고, `shared/styles/surfaces.ts` 머리말이 그 한 장을 쓸 자리를 딱 하나로 못 박는다:
 * *"쓸 거라면 화면당 딱 한 장 — 그 화면을 켠 이유(결과 요약·**마무리 CTA**)에만 쓰고,
 * 히어로에는 돌려놓지 마라."* 랜딩을 켠 이유는 "가서 계산해 보는 것"이고, 그 문장이 여기 있다.
 *
 * 실측이 그 판단을 뒷받침한다 — 흰 캔버스에서 이 줄은 **8장짜리 문서의 마지막 카드**인데
 * 바로 위 FAQ(1px 헤어라인)와 같은 무게였고, 바로 아래는 네이비 푸터였다. 페이지의 결론이
 * 배경과 구분되지 않는 상태였다.
 *
 * ## 왜 파스텔인데도 보이나 — 명도가 아니라 **색상**이 말한다 (실측)
 * ```
 *   흰 캔버스(#ffffff) 위          대비비(휘도)   ΔE76(지각차)
 *   brand-subtle   #e6fcf5           1.071          8.92   ← 이 줄. 민트 면으로 읽힌다
 *   surface-sunken #f1f3f5           1.112          4.43
 *   surface-muted  #f8f9fa           1.054          2.21   ← 대비비는 사실상 동급인데 안 보인다
 * ```
 * 대비비는 **휘도만** 재고 색상차를 못 본다. 셋 다 1.05~1.11 의 좁은 띠 안에 있어 휘도로는
 * 서로 구분되지 않는다 — 그런데 무채인 muted 는 ΔE 2.21 로 실제로 안 보이고, 거의 같은
 * 대비비(1.071)의 유채 brand-subtle 은 ΔE 8.92 로 **면으로 읽힌다**(muted 의 4배).
 * 실측 확인: 이 줄의 실제 값은 rgb(230,252,245) · 1160x120px 이고 tintscan 이 면으로 센다.
 * 🔴 그러니 이 근거를 `surface-muted` 를 카드에 까는 데 전용하지 마라 — 그 금지는 그대로다.
 *
 * 잉크 실측(velog 라이트): 문장 `text` on 이 면 **14.40:1** · 하마 `brand-text` on 흰 판 **5.00:1**.
 *
 * ## 🔴 왜 네이비 패널이 아닌가 (2026-08-03 1차 결정, 지금도 유효)
 * `brandPanel()` 을 여기 깔면 이 줄(y=3650)과 푸터(y=3846)가 **76px 사이로 같은 네이비를 두 번**
 * 세운다. 브랜드가 강해지는 게 아니라 같은 말을 두 번 하는 것이다. 밝은 민트 면 → 네이비 패널은
 * **경사**이고, 네이비 → 네이비는 **반복**이다. 예산이 풀린 지금도 고르는 값은 파스텔 쪽이다.
 *
 * 🔴 **금색을 여기 쓰지 마라.** 금색은 `brandPanel()` 이 깐 네이비 면 위에서만 합법이고
 * (밝은 면 위 1.83:1), 이 줄은 그 면이 아니다. `contrast.test.ts` 가 잡는다.
 *
 * ## 🔴 상단 6px 레일을 걷었다 — 장치는 층마다 하나다
 * 면을 얻었으므로 레일은 같은 말(브랜드)의 두 번째 발화다. 그리고 걷어낸 이유가 하나 더 있다:
 * `PICK_RADIUS`(34px @1280) 카드에 6px 리본을 얹으면 리본 끝이 카드의 곧은 왼쪽 모서리보다
 * **약 15px 안쪽**에서 끝난다(리본 깊이 6px 지점의 호 오프셋 = 34 − √(34²−28²) = 14.7px).
 * 부모 `overflow` 가 정상 클리핑하므로 **밖으로 새지는 않지만**, 눈에는 모서리가 한 입 베인 것으로
 * 읽힌다(실측 스크린샷으로 확인). 면이 그 역할을 대신하니 그 흠까지 함께 없어진다.
 * ⚠ 되살리려면 `shared/styles` 의 `topRail()` 을 쓰고 `overflow: hidden` 을 함께 선언하라 —
 *   지금은 리본이 없으므로 둘 다 필요 없다(geometry 가드는 리본이 있을 때만 문다).
 *
 * 🔴 **헤딩이 없다.** 여기에 h2 를 주면 문서의 h2 순서 계약(랜딩 구조 테스트)이 깨지고, "질문"도
 * "장"도 아닌 것이 목차에 들어간다. 이 줄은 마지막 액션이지 챕터가 아니다.
 *
 * ⚠ **DOM 계약**: 마무리 CTA 앵커의 `parentElement` 가 이 요소여야 하고, 이 요소가 갖는 **첫 `p`**
 *   가 닫는 문장이어야 한다(`test/landing/landingClosingCta.test.tsx`). 사이에 래퍼를 끼우지 마라.
 */
export const ClosingRow = styled.div`
  /*
   * 🔴 cardElevation() 을 쓰지 않는다. 그 헬퍼는 **중립 3층**(raised·base·sunken·pick)을 위한 것이고,
   * 이 줄은 그 축 밖의 **틴트 면**이다. 헬퍼를 부른 뒤 배경만 덮어쓰면 "테두리와 그림자를 동시에
   * 갖는 카드"가 조용히 되살아나는 길이 열린다 — 그래서 세 선언(면·테두리·그림자)을 여기서
   * 명시적으로, 한 번씩만 낸다.
   *
   * 테두리가 없는 이유: 경계는 **면색 자체**가 만든다(민트 vs 흰 캔버스). 여기에 1px 을 더하면
   * 흰 캔버스에서 격을 말하는 두 채널(면·경계)을 한 요소가 동시에 쓰게 된다.
   */
  background: ${color.brandSubtle};
  border: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: clamp(16px, 2.4vw, 28px);
  min-width: 0;
  padding: clamp(20px, 3vw, 32px);
  /* 고르는 면(PickCard·체크리스트)과 같은 반경 대역 — 페이지 끝에서 각이 갈리면 눈에 띈다. */
  border-radius: ${PICK_RADIUS};
`;

/**
 * 마스코트 슬롯 — 랜딩 마무리 패널의 **하마 + 금화 연출**이 서는 자리.
 *
 * ## 🔴 흰 판을 걷어냈다 (2026-08-03, 자산이 라스터로 바뀌면서)
 * 종전에는 56px 흰 판 위에 `currentColor` 로 그린 32px 심볼을 얹었다. 판이 필요했던 이유는
 * **심볼이 색을 갖지 못해서**였다 — 민트 면 위에 `brand-text` 하마를 직접 두면 유채 위 유채라
 * 형태가 뭉갠다. 지금 하마는 자기 음영과 외곽선을 가진 3D 렌더(`hippo.png`)라 어떤 면 위에서도
 * 스스로 선다(민트·흰·네이비 실측 확인). 판은 이제 **아무 일도 하지 않는 두 번째 면**이다.
 *
 * ⚠ 판을 되살리지 마라 — 88px 연출을 담으려면 판이 112px 이 되어야 하고, 그러면 금화가
 *   판의 둥근 모서리 **밖으로** 떠서 "실수로 삐져나온 그림"이 된다(연출의 핵심은 금화가
 *   무대 밖 오른쪽 위로 나가는 것이다 — `HippoCoinScene.styled.ts` SceneRoot 주석).
 *
 * 🔴 그래서 이 슬롯은 **면도 테두리도 갖지 않는다.** 이 줄이 이미 틴트 면이고, 랜딩의 면 예산은
 * 2장(이 줄 + 푸터 네이비)에서 끝났다 — 여기에 판을 더하면 `tintscan` 의 `/` 항목이 위험해진다
 * (지금은 폭 88px 이라 면 하한 180px 에 못 미쳐 애초에 세어지지 않는다).
 *
 * ⚠ `overflow` 를 자르지 마라. 금화가 이 상자 오른쪽 위로 약 7px(88의 8%) 나간다 — 그 자리는
 *   행의 gap(16~28px)이 흡수하고, 위쪽 5px 은 행의 padding(20~32px)이 흡수한다(실측).
 */
export const ClosingMark = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
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
  /* 틴트 면 위에서도 본문 텍스트 축 그대로다 — text / brand-subtle 은 contrast.test.ts 가
     16테마에서 재는 정식 쌍이다(text-secondary·brand-text 도 같은 목록에 있다). */
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
