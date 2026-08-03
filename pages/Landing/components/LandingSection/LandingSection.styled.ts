import styled from '@emotion/styled';
import { appHeaderHeight, color, font, iconOpticalAlign, media, pageHue, radius, space } from '@/shared/styles';
import type { LandingSectionEmphasis, LandingSectionTone } from './LandingSection.types';

/**
 * 랜딩 여섯 장이 **같은 골격**을 갖게 하는 껍데기 — 2열 스파인(번호 기둥 + 본문 밭).
 *
 * ## 이 파일이 소유하는 판단 셋
 *  ① **레이아웃** — ≥`layout` 에서 `[기둥][밭]`. 좁은 폭에서는 한 열.
 *  ② **장 경계** — 장마다 전폭 룰이 하나 그어진다(등급 `chapter` 만 2px hue, 나머지 1px 중립).
 *  ③ **타이포 대비** — 이 지면의 h2 는 **랜딩 전용 곡선**을 쓴다(아래 주석).
 *
 * 이 껍데기는 **면을 만들지 않는다.** 랜딩의 틴트 면은 정확히 2개(마무리 CTA + 푸터 패널)이고,
 * 장 머리가 색을 쓰는 자리는 36px 배지와 1~2px 룰뿐이다 — 둘 다 `tintscan` 의 면 하한(180x8px)
 * 밖이고, 테두리는 배경만 보는 스캐너의 대상 자체가 아니다.
 */

/** 배지 톤 — 전부 대비가 검증된 토큰 쌍이다. 파생 면(color-mix) 위에 글리프를 얹지 않는다. */
const TONE = {
  identity: { bg: color.identitySubtle, fg: color.identityText },
  accent: { bg: color.accentSubtle, fg: color.accentText },
  accentAlt: { bg: color.accentAltSubtle, fg: color.accentAltText },
  neutral: { bg: color.surfaceSunken, fg: color.textSecondary }
} as const satisfies Record<LandingSectionTone, { bg: string; fg: string }>;

/**
 * 🔴 **장 머리 룰 — 이 문서에서 "본론"을 말하는 유일한 구조 장치.**
 *
 * before 는 이 룰이 *제목 아래*에 있었다. 스파인으로 바뀌면서 그 자리는 왼쪽 기둥 안쪽 300px 에
 * 갇혀 "장이 시작된다"를 말하지 못한다 — 그래서 **섹션 전폭의 상단 룰**로 옮겼다.
 * 장치 수는 그대로 하나다(굵기·색 한 쌍). 2px 은 tintscan 의 면 하한(높이 8px)에 걸리지 않고,
 * `border` 는 backgroundColor 만 보는 스캐너의 대상이 아니다(이중 안전).
 *
 * 색이 유일한 신호가 아니다 — 굵기(1px↔2px)와 장 번호·그룹 여백이 같은 것을 함께 말한다.
 */
const EMPHASIS_RULE: Record<LandingSectionEmphasis, string> = {
  chapter: `2px solid ${pageHue}`,
  support: `1px solid ${color.border}`,
  reference: `1px solid ${color.border}`
};

export const SectionRoot = styled.section<{ $emphasis: LandingSectionEmphasis }>`
  display: grid;
  gap: clamp(16px, 2.2vw, 26px);
  min-width: 0;
  padding-top: clamp(20px, 2.4vw, 32px);
  border-top: ${({ $emphasis }) => EMPHASIS_RULE[$emphasis]};
  /* 차례에서 눌러 도착했을 때 sticky 헤더 뒤로 제목이 숨지 않게. 헤더 높이는 실측 변수를 쓴다
     (하드코딩하면 한 줄↔두 줄 헤더 전환마다 조용히 낡는다 — headerSurface.ts 머리말). */
  scroll-margin-top: calc(${appHeaderHeight} + ${space[4]});

  ${media.up('layout')} {
    /* 🔴 기둥 폭은 내용 기준이 아니라 고정 대역이다 — 제목이 2~3줄로 감기는 장(프리셋·리듬)과
       한 줄인 장(FAQ)이 같은 기둥 폭을 가져야 여섯 장의 왼쪽 정렬선이 하나로 읽힌다. */
    grid-template-columns: clamp(220px, 24vw, 300px) minmax(0, 1fr);
    column-gap: clamp(32px, 4vw, 64px);
    align-items: start;
  }
`;

/**
 * 왼쪽 기둥 — 장 번호 · 배지 · 제목.
 *
 * `sticky` 인 이유: 프리셋 장은 실측 1000px 이 넘는다. 그 안을 읽는 동안 제목이 화면 밖으로 나가면
 * "지금 무엇을 보고 있나"가 사라진다. ⚠ 조상에 `overflow: hidden` 이 생기면 sticky 는 **에러 없이**
 * 죽는다 — 랜딩 스택·그룹·셸은 전부 overflow 를 선언하지 않는다(그 상태를 유지하라).
 */
export const SectionAside = styled.div`
  display: grid;
  gap: ${space[3]};
  align-content: start;
  min-width: 0;

  ${media.up('layout')} {
    position: sticky;
    top: calc(${appHeaderHeight} + ${space[6]});
  }
`;

/** 번호 + 배지 한 줄. 둘 다 장식이라 접근성 트리에 없다(순서는 문서 순서가 이미 말한다). */
export const SectionMark = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 장 번호 — **색을 쓰지 않는 위계 장치**다.
 *
 * 크기(28~38px)와 데이터 서체만으로 서고, 색은 `text-muted` 다. 색을 얹지 않는 이유는 이 지면의
 * 채도 예산이 아니라 **역할** 때문이다: 번호는 "몇 번째"만 말하고 "얼마나 중요한지"는 말하지 않는다.
 * 중요도는 장 머리 룰 하나가 소유한다(EMPHASIS_RULE 주석).
 */
export const SectionOrdinal = styled.span`
  flex: 0 0 auto;
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['4xl']}, calc(0.8rem + 1.6vw), ${font.size['5xl']});
  font-weight: ${font.weight.bold};
  line-height: 1;
  letter-spacing: -0.04em;
  color: ${color.textMuted};
  ${font.numeric}
`;

/**
 * 36px 배지. 틴트 면 하한(180px)에 한참 못 미치므로 tintscan 의 "면" 집계에 잡히지 않는다 —
 * 랜딩의 채도는 면이 아니라 이런 글리프들이 만든다.
 */
export const SectionBadge = styled.span<{ $tone: LandingSectionTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  background: ${({ $tone }) => TONE[$tone].bg};
  color: ${({ $tone }) => TONE[$tone].fg};

  svg {
    display: block;
    width: 18px;
    height: 18px;
  }
`;

/**
 * 🔴 **랜딩 전용 제목 곡선(20 → 30px)이다. 공용 `sectionTitleFontSize`(16~18px)를 쓰지 않는다.**
 *
 * 근거: 공용 값은 **앱 안쪽 화면**(시뮬레이터·포트폴리오)의 규칙이다. 그 화면들은 한 뷰포트에
 * 섹션이 여럿 들어차는 대시보드라 제목이 커지면 정보 밀도가 무너진다. 랜딩은 반대다 — 여섯 장이
 * 세로로만 이어지는 문서이고, 18px 제목은 카드 제목(16px)과 두 단계밖에 안 벌어져 **장과 카드가
 * 같은 무게로** 읽혔다(사용자 지적: "밋밋하다"). 지금 위계는 h1 44 / h2 30 / h3 16 / 본문 13~14 다.
 *
 * ⚠ `decisions.md 2026-07-29`("섹션마다 다른 축소 곡선을 만들지 마라")를 어기지 않는다 —
 * 그 규칙이 금지한 것은 **섹션마다** 다른 곡선이고, 이것은 **라우트 하나가 여섯 장에 공통으로**
 * 쓰는 한 개의 곡선이다. 랜딩 밖으로 복사하지 마라.
 */
export const SectionTitle = styled.h2`
  margin: 0;
  min-width: 0;
  font-family: ${font.display};
  font-size: clamp(${font.size['2xl']}, calc(0.7rem + 1.4vw), ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.03em;
  color: ${color.text};
  word-break: keep-all;
  /* 헤딩 서체는 잉크 중심이 라인박스 중심보다 위에 있다 — 왼쪽 번호·배지와 첫 줄을 맞춘다. */
  ${iconOpticalAlign('display', font.size['2xl'])}
`;

/** 본문 밭 — 리드와 내용물이 여기 산다. 기둥이 아니라 이쪽이 68ch 를 쓸 수 있는 열이다. */
export const SectionBody = styled.div`
  display: grid;
  gap: clamp(16px, 2vw, 24px);
  align-content: start;
  min-width: 0;
`;

export const SectionLede = styled.p`
  margin: 0;
  max-width: 68ch;
  font-family: ${font.sans};
  /* 리드는 본문(13px)보다 한 단 위다 — 장을 여는 문장이라 본문과 같은 크기면 여는 역할을 못 한다. */
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;

  ${media.down('mobileWide')} {
    font-size: ${font.size.sm};
  }
`;
