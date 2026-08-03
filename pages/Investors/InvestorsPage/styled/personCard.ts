import styled from '@emotion/styled';
import { PICK, color, font, media, radius, space } from '@/shared/styles';

/* ── ③ 인물 카드 격자 (brand 면) ───────────────────────────────────────────── */
/* 카드 본문의 구성 스택바·범례는 `composition.ts` 에 있다. */

export const PersonsSection = styled.section`
  display: grid;
  gap: ${space[5]};
  min-width: 0;
`;

/**
 * 인물 카드 격자 — **1 → 2 → 3열**.
 *
 * 1차까지는 넓은 화면에서도 2열이었다. 이유는 카드 안에 104px 도넛 + 세로 범례가 있어 3열이
 * 되면 도넛과 범례가 세로로 접혀 카드가 되레 길어졌기 때문이다. 그 제약을 **구성 표현을 바꿔서**
 * 없앴다 — 전폭 스택바 + 2열 범례는 좁은 칸에서도 눕지 않는다. 그래서 13장이 5줄에 들어온다.
 *
 * ⚠ 공용 `PickCardGrid`(auto-fill)를 쓰지 않는 이유는 마지막 줄에 한 장만 남았을 때 그 카드가
 *   열 폭 전체로 늘어나 격자가 어긋나기 때문이다. 명시적 열 수가 이 화면에는 맞다.
 * ⚠ 간격은 `PICK.gap` — 부상 그림자(blur 12px)가 12px 간격에서 옆 카드에 닿는다.
 */
export const CardGrid = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${PICK.gap};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('tabletSm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.up('headerStack')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

/**
 * 격자 한 칸.
 *
 * 🔴 **드로어는 카드 *밖*, 이 칸 안에 있다.** `PickCard` 는 hover/focus 에서 `transform` 을 쓰므로
 * 스태킹 컨텍스트이자 `position: fixed` 자손의 컨테이닝 블록이 된다 — 카드 안에 드로어를 두면
 * 열리는 순간 전폭 패널이 카드 좌표계에 갇힌다. 이 칸은 transform 이 없어 안전하다.
 */
export const CardItem = styled.li`
  display: grid;
  min-width: 0;
`;

/**
 * 인물 모노그램 — `PickCard` 의 40px 글리프 배지 안을 **가득** 채운다.
 *
 * ⚠ 사진이 아니다. 실존 인물 사진은 대부분 저작권이 있어 13명을 자유 라이선스로 채울 수 없다.
 * 🔴 면은 16% 틴트 · 글자는 중립 `text` · 테두리만 시리즈 솔리드다 — 시리즈 색은 비텍스트 3:1
 *    로만 검증된 색이라 그 위의 텍스트는 대비 계약 밖이다(`contrast.test.ts`).
 */
export const Monogram = styled.span<{ $color: string }>`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  border: 1px solid ${({ $color }) => $color};
  background: color-mix(in srgb, ${({ $color }) => $color} 16%, ${color.surface});
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

/**
 * 자료가 오래됐다는 **짧은 배지**.
 * 🔴 문장 전체를 경고 면에 담으면 폭 534px 짜리 틴트 면이 되어 라우트 상한을 깬다(실측).
 *    그래서 **색은 배지가, 문장은 중립 텍스트가** 진다 — 숨긴 것은 없다.
 */
export const StaleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border: 1px dashed ${color.warning};
  border-radius: ${radius.pill};
  background: ${color.warningSurface};
  color: ${color.warning};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

/** 오래된 자료의 **문장**. ⚠ "청산했다"가 아니라 "공시가 확인되지 않는다"까지만 말한다. */
export const StaleLine = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
`;

export const PersonNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 🔴 **카드 본문의 위계를 만드는 자리.**
 *
 * 1차까지 기준일·규모·종목 수는 **같은 크기의 칩 세 개**였다. 셋이 같은 무게면 위계가 없고,
 * 열세 장이 전부 같은 회색 덩어리로 읽힌다. 인물끼리 실제로 갈리는 값은 **규모** 하나이므로
 * 그것만 30px 숫자로 세우고, 기준일은 그 숫자의 캡션으로 붙인다(둘은 한 사실이다).
 */
export const Figure = styled.div`
  display: grid;
  gap: 2px;
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const FigureValue = styled.strong`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['3xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: 1.05;
  ${font.numeric}
`;

/** 🔴 기준일은 **인물마다 다르다** — 전역 하나로 묶으면 거짓이 된다. 그래서 숫자에 붙여 둔다. */
export const FigureCaption = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[1]};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
`;

/** 보유 종목 수 + 옵션 표시. 규모 아래에 한 줄로 눕는 보조 사실들이다. */
export const MetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
`;

/**
 * 옵션이 섞였다는 표시.
 *
 * 🔴 `position: relative; z-index: 1` 은 장식이 아니다. `PickCard` 의 스트레치 컨트롤은
 *    의사요소(inset 0)로 카드 전체를 덮으므로, 그냥 두면 이 칩 위의 마우스가 카드 버튼에 먹혀
 *    `title` 말풍선이 절대 뜨지 않는다(2026-08-03 elementFromPoint 실측).
 * ⚠ 손익색을 쓰지 않는다 — 옵션은 "손실"이 아니라 포지션의 종류다.
 */
export const OptionChip = styled.span`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 1px ${space[2]};
  border: 1px dashed ${color.accentAltText};
  border-radius: ${radius.pill};
  background: ${color.accentAltSubtle};
  color: ${color.accentAltText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;
