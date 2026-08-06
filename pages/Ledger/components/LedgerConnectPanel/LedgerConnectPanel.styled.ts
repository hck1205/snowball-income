import styled from '@emotion/styled';
import { PickCardGrid } from '@/components/common';
import { PICK_RADIUS, brandPanel, color, font, iconOpticalAlign, media, radius, space } from '@/shared/styles';

/**
 * §4.1 **연결 전 화면 — 이 화면의 첫인상**.
 *
 * ## 왜 다시 짰나 (2026-08-03)
 * 예전 구조는 `제목 h2` + `tone="wash"` 카드 두 장 + 힌트 두 줄 + 테두리 상자 안 불릿 네 개였다.
 * 문제가 셋이었다.
 *  1. **위계가 없다.** 제목·카드 제목·힌트가 전부 비슷한 무게라 "여기서 무엇을 해야 하는가"가
 *     화면에서 즉시 읽히지 않았다.
 *  2. **절차가 안 보인다.** 시트를 고르면 곧바로 셀렉트 다섯 개짜리 낯선 화면이 떴다 — 그게 몇
 *     단계 중 어디인지 말하는 것이 화면에 없었다.
 *  3. **틴트 예산 초과.** `wash` 카드 두 장이 각각 `gradient-hero-soft` 면이라 히어로까지 합해
 *     한 화면에 색면이 셋이었다(상한 2).
 *
 * 지금은 **무대 → 선택 → 고지**의 3단이다.
 *  - 무대(`ConnectStage`)는 이 앱에서 유일한 **네이비 반전 면**(`brandPanel()`)이고 마스코트·리드·
 *    절차 표시줄이 여기 산다. 색면 하나(히어로 다음 자리)를 여기에 몰아 준다.
 *  - 선택은 공용 `PickCard` 두 장 — **6px 레일 캡**이라 면으로 세어지지 않는다(예산 유지).
 *  - 고지는 불릿 목록이 아니라 **글리프 + 문장 2열 격자**다. 네 문장이 각각 다른 사실이라
 *    문단으로 뭉치면 하나도 안 읽힌다.
 *
 * 🔴 두 선택지의 **무게는 여전히 같다** — 같은 카드 부품·같은 `secondary` 버튼이고 어느 쪽도
 * `primary` 가 아니다. 이 대칭을 깨는 순간 다른 하나가 종속 선택지로 읽힌다.
 */
export const ConnectSection = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;
`;

/**
 * 네이비 무대. 🔴 `brandPanel()` 은 **brand 면에서만** 부른다 — 여기는 "무엇으로 시작할지 고르는"
 * 자리라 정의상 brand 면이다(판정 한 줄: *여기서 무언가를 고르면 화면이 바뀌는가*).
 *
 * 반경은 고르는 면의 대역(`PICK_RADIUS`, 30~34px)을 쓴다. 아래 선택 카드와 같은 곡률이라
 * 무대와 카드가 한 벌로 읽힌다.
 */
export const ConnectStage = styled.div`
  ${brandPanel()}
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: start;
  gap: ${space[4]};
  min-width: 0;
  padding: clamp(24px, 4vw, 40px);
  border-radius: ${PICK_RADIUS};
`;

/** 마스코트 자리. 🔴 금화(`accent`)는 **네이비 위에서만** 켠다(밝은 면에서는 1.83:1 이다). */
export const StageMascot = styled.span`
  display: inline-flex;
  color: ${color.onPanel};
`;

export const ConnectHeading = styled.h2`
  margin: 0;
  max-width: 22ch;
  font-size: clamp(${font.size['2xl']}, 3.4vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.onPanel};
`;

/** 무대의 리드 한 줄. 반전 면이라 `textSecondary` 가 아니라 `onPanelMuted` 를 쓴다. */
/**
 * 무대 리드. 🔴 `max-width: 46ch` 를 걷었다(2026-08-03 사용자 지시: "두 줄로 표기하지 말고 한 줄로,
 * 작아지면 자연스럽게 linefeed"). 46ch 는 이 문장(41자)을 넓은 화면에서도 **강제로 두 줄**로 접었다 —
 * 읽기 좋은 줄길이를 지키려던 값이 여기서는 짧은 한 문장을 쪼개는 역할만 했다.
 * 이제 폭이 모자랄 때만 접힌다.
 * ⚠ `word-break: keep-all` 이라 단어 중간에서 끊기지 않는다 — 접혀도 어절 경계다.
 */
export const StageLede = styled.p`
  margin: 0;
  word-break: keep-all;
  font-size: ${font.size.lg};
  line-height: ${font.leading.normal};
  color: ${color.onPanelMuted};
`;

/** 무대와 절차 줄 사이의 얇은 구분선. 금색 28% 라 반전 면 위에서만 성립한다. */
export const StageDivider = styled.span`
  display: block;
  width: 100%;
  height: 1px;
  background: color-mix(in srgb, ${color.onPanelGold} 28%, transparent);
`;

/**
 * 선택 격자 — 두 선택지가 **폭을 절반씩** 나눠 갖는다(2026-08-04 사용자 지시).
 *
 * ## 왜 공용 격자를 그대로 두지 않았나 (1280px 실측)
 * 공용 `PickCardGrid` 는 `auto-fill` 이라 열 수를 **폭이** 정한다. 이 패널 폭 1160px 이 열 최소폭
 * 260px 로 잘려 `278px × 4칸` 이 됐고, 카드는 둘뿐이라 왼쪽 572px 만 쓰고 나머지가 빈 채로 남았다
 * (1024px 에서도 314px × 3칸 중 두 칸). 2열로 못 박으면 1280px 에서 각 572px, 1024px 에서 각 477px 다.
 *
 * 🔴 이 화면의 핵심 규율인 **두 선택지의 동일한 무게**를 폭까지 확장한 것이다 — 같은 부품·같은
 * 버튼 변형에 더해 이제 **같은 폭**이다. 열 수가 폭 따라 변하면 좁은 구간에서 한쪽만 접히는 순간이
 * 생길 수 있는데, 고정 2열은 둘이 항상 함께 접히게 한다.
 *
 * ⚠ 공용 부품은 고치지 않는다 — 커뮤니티 갤러리·빈 상태 격자가 같은 부품을 auto-fill 로 쓴다.
 *   styled() 로 감싸 넘긴 className 을 Emotion 이 부품 자체 스타일 **뒤**에 합치므로 여기 적은
 *   열 규칙이 이긴다. 간격(PICK.gap)은 부품 것을 그대로 쓴다.
 *
 * ⚠ **선택지가 셋 이상이 되면 이 값을 다시 판정하라.** 지금은 "기존 시트 / 새로 만들기" 둘이
 *   전부라 2열이 곧 50:50 이지만, 세 번째 선택지가 붙으면 셋째 장이 둘째 줄 왼쪽 절반에 홀로 선다.
 *   그때의 선택지는 (a) 3열로 올리기 (b) 마지막 한 장에 `grid-column: 1 / -1` 로 전폭 주기 —
 *   어느 쪽이든 "무게가 같다"는 위 규율을 깨지 않는 쪽을 고른다. 열 수를 auto-fill 로 되돌리지는
 *   마라(그러면 1280px 에서 다시 빈 열이 생긴다).
 *
 * 접힘은 `mobileWide`(≤640px)에서 1열이다 — 아래 `PrivacyGrid` 가 접히는 경계와 같은 값이라
 * 이 화면의 두 격자가 **한 폭에서 함께** 접힌다. 641px 에서 각 열이 302px 라 종전 auto-fill 이
 * 요구하던 최소폭(260px)보다 넓다 — 어떤 폭에서도 카드가 지금보다 좁아지지 않는다.
 */
export const ChoiceGrid = styled(PickCardGrid)`
  grid-template-columns: repeat(2, minmax(0, 1fr));

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 선택 타일의 설명문.
 *
 * 🔴 `PickCard` 의 `subtitle` 로 넘기지 마라 — 그 슬롯은 12px 캡션이라 두 줄짜리 설명문에는 너무
 * 작다. 한글 산문이라 `overflow-wrap: anywhere` 는 쓰지 않는다.
 */
export const ChoiceBody = styled.p`
  margin: 0;
  max-width: 44ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

/**
 * 🔴 **보안 고지 — 권한을 허용하기 "전"에 읽히는 자리다.**
 *
 * 가계부는 소득·지출이라 이 앱에서 가장 민감한 데이터다. 그래서 각주(`PageFooter`)가 아니라
 * 연결 화면 **본문**에 세운다. 사용자가 "무엇을 허용하는가"를 판단하는 순간에 보여야 의미가 있다.
 *
 * ⚠ 틴트 면을 쓰지 않는다 — 화면의 색면 예산은 히어로와 위 무대가 이미 다 쓴다. 여기서는
 * **1px 경계 + 색 있는 제목 + 글리프**로 무게를 만든다.
 */
export const PrivacyNote = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(16px, 2vw, 20px);
  border: 1px solid ${color.identityBorder};
  border-radius: ${radius.lg};
  min-width: 0;
`;

/**
 * 방패 글리프 + 제목 한 줄.
 *
 * 🔴 `align-items: center` 만으로는 **맞지 않는다** — 제목이 헤딩 서체(Gmarket)라 라인박스 중심이
 * 잉크 중심보다 아래에 있어 아이콘이 2.25px 내려가 보였다(uiprobe `--align` 실측, 2026-08-03).
 * 이 레포에서 가장 자주 재발한 결함이라 눈이 아니라 유틸(`iconOpticalAlign`)로 잠근다.
 */
export const PrivacyHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.identityText};

  svg {
    ${iconOpticalAlign('display', font.size.lg)}
  }
`;

export const PrivacyTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.identityText};
`;

/**
 * 네 사실을 **2열 격자**로 편다(예전에는 불릿 목록이었다). 각 항목이 자기 글리프를 갖는 이유는
 * 넷이 서로 다른 축이기 때문이다 — 어디에 남는가 · 무엇을 허용하는가 · 이 브라우저에 무엇이
 * 남는가 · 어떻게 취소하는가.
 */
export const PrivacyGrid = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${space[3]} ${space[5]};
  min-width: 0;

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const PrivacyItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[3]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};

  svg {
    margin-top: 2px;
    color: ${color.identityText};
  }
`;

/**
 * 선택 카드의 제목 줄 — **아이콘 + 글자가 한 줄**이다(2026-08-03 사용자 지시).
 *
 * 종전에는 PickCard 의 cap(레일 + 배지)이 제목 **위**에 블록으로 서서 카드가 두 층이 됐다.
 * 선택지가 둘뿐인 화면에서 그 층은 정보를 더하지 않고 높이만 키웠다.
 *
 * ⚠ 아이콘이 줄어들지 않게 flex-shrink 0 이다 — 줄지 않아야 글자만 접힌다.
 * ⚠ align-items 는 center 가 아니라 baseline 을 쓰지 않는다: 라인아트 아이콘의 시각 중심은
 *   한글 라인박스 중심과 어긋나서, baseline 정렬이면 아이콘이 눈에 띄게 내려앉는다(이 레포 단골 결함).
 */
export const ChoiceTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;

  svg {
    flex: 0 0 auto;
    color: ${color.brandText};
  }
`;
