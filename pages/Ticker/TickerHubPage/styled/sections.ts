import styled from '@emotion/styled';
import { appHeaderHeight, color, font, iconOpticalAlign, radius, space } from '@/shared/styles';
import { CAT_COLORS, CAT_GROUP_1, CAT_GROUP_2, CAT_VAR, sectionSelector } from './tokens';

/* ── 카테고리 섹션 ────────────────────────────────────────────────────────── */

/**
 * 카테고리 블록.
 *
 * 🔴 `scroll-margin-top` 은 해시 앵커(`#high-dividend`)로 뛰어왔을 때 고정 헤더에 제목이 가리지
 * 않게 하는 값이다. 이 화면의 색인이 **해시 앵커**로 동작하므로 지우지 마라.
 *
 * ⚠ scroll-driven 리빌을 의도적으로 두지 않는다. 진입 진행도에 opacity 를 매면 아직 화면 아래쪽에
 * 있는 카테고리들이 흐릿하게 비쳐 "덜 그려진 화면"으로 읽힌다(2026-07-25 사용자 요청으로 제거).
 */
export const CategorySection = styled.section`
  ${CAT_VAR}: ${CAT_COLORS[0]};

  ${sectionSelector(CAT_GROUP_1)} {
    ${CAT_VAR}: ${CAT_COLORS[1]};
  }
  ${sectionSelector(CAT_GROUP_2)} {
    ${CAT_VAR}: ${CAT_COLORS[2]};
  }

  scroll-margin-top: calc(${appHeaderHeight} + ${space[4]});
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

/**
 * 섹션 머리말 — **번호 + 라벨 + 헤어라인**.
 *
 * 상세 페이지의 `SectionEyebrow` 와 같은 문법이다. 종전 허브는 제목 왼쪽 4px 레일 하나가 전부라
 * "여기가 제목"만 말하고 **이 라이브러리가 몇 칸으로 이뤄졌는지**는 말하지 못했다. 번호와 가로선이
 * 그 일을 한다(레일 색인의 번호와 같은 값).
 */
export const SectionEyebrow = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[3]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(${CAT_VAR});
  ${font.numeric};

  &::after {
    content: '';
    flex: 1 1 auto;
    height: 1px;
    background: ${color.border};
  }
`;

export const SectionHead = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 카테고리 제목의 글자 크기.
 *
 * 🔴 **한 곳에서만 정한다.** 옆에 서는 글리프·개수 칩이 `iconOpticalAlign` 으로 잉크 중심을 맞추는데,
 * 그 보정량은 **글자 크기에 비례**한다(display 서체 = 크기의 0.1배만큼 위로). 그래서 제목이
 * clamp 로 자라면 보정도 같이 자라야 한다.
 *
 * 이 상수를 만든 이유가 실제 결함이다 — 제목을 `2xl` 고정에서 이 clamp 로 올리면서 보정만 `2xl`
 * 로 남겨 뒀더니, 1280px(제목 30px)에서 필요 보정 3px 중 2px 만 걸려 글리프·칩이 **1.1~1.6px
 * 낮게** 앉았다(uiprobe --align 13건, 2026-08-03). 세 곳이 같은 값을 읽으면 다시 갈라지지 않는다.
 */
const SECTION_TITLE_SIZE = `clamp(${font.size['2xl']}, 2.4vw, ${font.size['4xl']})`;

/**
 * 카테고리 제목.
 *
 * 🔴 종전 `2xl` 고정에서 clamp 상한 `4xl` 로 올렸다 — 카드 심볼(2xl~3xl)보다 작아서, 30장의 카드가
 * 자기를 묶는 제목보다 크게 읽혔다(위계 역전). 제목이 카드보다 커야 목록이 목록으로 읽힌다.
 */
export const SectionHeading = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[3]};
  font-size: ${SECTION_TITLE_SIZE};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
`;

/** 제목 앞 글리프 — 카테고리를 **모양으로도** 말한다(색이 단독 채널이 되지 않게). */
export const SectionGlyph = styled.span`
  ${iconOpticalAlign('display', SECTION_TITLE_SIZE)}
  display: inline-flex;
  flex: 0 0 auto;
  color: var(${CAT_VAR});
`;

/**
 * 섹션 종목 수 — 값은 중립색이다(색은 칩의 테두리·앞 글리프 같은 크롬에만).
 *
 * 🔴 **잉크 보정(`iconOpticalAlign`)을 걸지 않는다**(2026-08-06 사용자 지시: 세로 가운데로 맞춰라).
 * 그 보정은 **글리프 전용**이다 — 선 아이콘은 자기 텍스트가 없어 라인박스 중심과 잉크 중심의
 * 어긋남을 스스로 못 메운다. 반면 이 칩은 **자기 글자를 가진 상자**라, 안쪽은 자기 라인박스가
 * 이미 가운데를 맞추고 바깥쪽은 부모의 `align-items: center` 가 상자를 맞춘다. 거기에 아이콘 보정을
 * 더하면 **두 번 보정**돼 칩만 3px 떠오른다(실측: 제목 중심 613 vs 칩 중심 610).
 *
 * ⚠ 위 `SectionGlyph` 는 보정을 그대로 둔다 — 그쪽은 글자가 없는 진짜 글리프다. 둘을 같이 고치지 마라.
 */
export const SectionCount = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid color-mix(in srgb, var(${CAT_VAR}) 32%, transparent);
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  color: ${color.text};
  ${font.numeric};
`;

/**
 * 카테고리 안에 결과가 없을 때의 한 줄.
 *
 * 🔴 섹션 자체는 남는다 — 이 자리가 해시 앵커의 목적지라, 필터에 따라 섹션이 사라지면 색인 링크가
 * 조용히 아무 데도 못 간다. 초라해 보이지 않게 점선 테두리와 한 문장을 준다.
 *
 * ⚠ 점선 + `borderStrong` + `surfaceMuted` 는 이 앱이 "비어 있음"에 쓰는 **공통 어휘**다
 * (`FeedStates.EmptyRoot` · `empty.ts` 의 `EmptyState`). 흰 캔버스에서는 면색(1.02~1.08:1)이 거의
 * 아무 말도 못 하므로 격은 점선 경계(3.2~3.4:1)가 진다 — 그래서 `border` 가 아니라 `borderStrong` 이다.
 */
export const SectionEmpty = styled.p`
  margin: 0;
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px dashed ${color.borderStrong};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
