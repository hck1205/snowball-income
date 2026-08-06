import type { ElementType, ReactNode } from 'react';

/**
 * 컬러 캡의 **형태**. 이 선택이 `tintscan`(틴트 면 예산) 판정을 가른다.
 *
 * - `rail` — 중립 면 + 상단 **6px** 컬러 줄. 높이 6 < 8 이라 **면으로 세어지지 않는다.**
 *   예산이 빠듯한 화면(랜딩·시뮬레이터·404·가계부 진입)의 기본값이다.
 * - `tint` — L2 틴트 면 48/64/88px, 3변 bleed. **세어진다** → 격자 부모에
 *   `data-tint-cluster="pick-grid"`(= `PickCardGrid cluster`)를 달지 않으면 예산이 즉시 터진다.
 */
export type PickCapKind = 'rail' | 'tint';

/**
 * 캡의 **색 축**. 색을 부품이 스스로 만들지 않고 **역할 이름**으로 받는다.
 *
 * `scoped` 는 호출부가 자기 CSS 변수를 주는 경우다 — 티커 상세의 `--tk-active-bg`,
 * 차트 시리즈 변수(`--sb-chart-series-N`) 처럼 **런타임에 정해지는 색**이 여기 들어온다.
 */
export type PickCapAxis = 'brand' | 'accent' | 'accentAlt' | 'identity' | 'scoped';

/** 틴트 캡의 높이 3단 (`PICK.capHeight`). 레일 캡에서는 무시된다. */
export type PickCapHeight = 'sm' | 'md' | 'lg';

/**
 * 레일 캡 글리프 배지의 크기. 기본 `md`(40px, `PICK.glyphSize`).
 *
 * `lg`(112px, `PICK.glyphSizeLg`)는 **글리프가 사진일 때만** 쓴다 — 40px 짜리 얼굴은 누구인지
 * 알아볼 수 없어 사진을 쓴 의미가 사라진다. 아이콘·이니셜은 그대로 `md` 다(선 아이콘을 112px 로
 * 키우면 카드 머리가 아이콘 전시장이 된다).
 * ⚠ 틴트 캡에서는 무시된다 — 그쪽 글리프는 캡 높이가 이미 크기를 정한다.
 */
export type PickCapGlyphSize = 'md' | 'lg';

/**
 * 레일 캡 글리프 배지의 **윤곽**. 기본 `rounded`(둥근 사각).
 *
 * `circle` 은 **글리프가 사람 얼굴일 때** 쓴다(2026-08-06 사용자 지시, 대가 카드). 인물 사진은
 * 원형이 관례이고 — 프로필이라는 뜻 자체가 모양에 실려 있다 — 사각 크롭은 배경과 어깨가 함께
 * 잘려 들어와 얼굴이 덜 도드라진다. 아이콘·로고는 그대로 `rounded` 다(원 안의 선 아이콘은
 * 여백이 어색하게 남는다).
 */
export type PickCapGlyphShape = 'rounded' | 'circle';

export type PickCardCap = {
  kind: PickCapKind;
  axis: PickCapAxis;
  /**
   * `axis: 'scoped'` 일 때 **필수**. 면/줄의 색이 될 CSS 변수 이름(`--` 포함).
   * 예: `'--tk-active-bg'` · `'--sb-chart-series-3'`.
   */
  scopedVar?: string;
  /**
   * `axis: 'scoped'` 의 **글자·글리프 색** 변수. 생략하면 중립 텍스트로 떨어진다 —
   * 모르는 색 위에 색 글자를 얹는 것은 대비를 보장할 수 없기 때문이다(예: `'--tk-text'`).
   */
  scopedInkVar?: string;
  /**
   * 🔴 **필수.** 색은 결코 단독 채널이 될 수 없다 — 캡 색이 말하는 축을 아이콘이 함께 말한다.
   * 회색조로 인쇄해도 카드가 구분되어야 한다.
   */
  glyph: ReactNode;
  /** 캡 안에 함께 읽히는 짧은 라벨(카테고리명 등). 스크린리더에도 그대로 읽힌다. */
  label?: ReactNode;
  /** 틴트 캡 높이. 기본 `md`(64px). */
  height?: PickCapHeight;
  /** 레일 캡 글리프 배지 크기. 기본 `md`(40px). 사진 글리프만 `lg`. */
  glyphSize?: PickCapGlyphSize;
  /** 레일 캡 글리프 배지 윤곽. 기본 `rounded`. 사람 얼굴만 `circle`. */
  glyphShape?: PickCapGlyphShape;
  /**
   * 글리프를 제목 **위**가 아니라 **같은 줄 왼쪽**에 세운다(2026-08-06 사용자 지시, 대가 카드).
   *
   * 왜 옵션인가: 아이콘 글리프는 위에 쌓는 편이 맞다(작아서 제목 옆에 두면 장식으로도 안 읽힌다).
   * 반면 **사진**은 이름과 한 줄에 있어야 "이 얼굴이 이 사람"이 한 번에 읽히고, 카드도 그만큼 짧아진다.
   *
   * 🔴 **DOM 계약**: `kind: 'rail'` 이고 `label` 이 없을 때만 켜진다. 레일 캡의 자식 순서
   * (레일 → 글리프 → 머리 → 본문 → 액션)에 기대어 배치하기 때문에, 라벨이 끼면 한 칸씩 밀린다.
   * 부품이 그 조건을 스스로 확인하고 아니면 조용히 기본(쌓기)으로 떨어진다.
   */
  glyphInline?: boolean;
};

export type PickCardProps = {
  /** 카드의 이름. 이 카드에서 읽히는 유일한 제목이라 크기는 `pickTitleFontSize` 를 쓴다. */
  title: ReactNode;
  /** 제목 오른쪽 슬롯(배지·제거 버튼 등). **버튼을 넣어도 된다** — 스트레치 컨트롤의 형제다. */
  titleRight?: ReactNode;
  subtitle?: ReactNode;
  cap?: PickCardCap;
  children?: ReactNode;
  /** 카드 하단 액션 줄. 여기 들어간 버튼은 스트레치 컨트롤 **위**에 뜬다(별도 클릭 가능). */
  actions?: ReactNode;

  /* ── 카드 전체를 누를 수 있게 만드는 세 갈래 (하나만 준다) ───────────────── */
  /** 앱 내부 이동. `react-router` 의 `Link` 로 렌더된다(SPA 전환 유지). */
  to?: string;
  /** 외부 링크·앵커. 평범한 `a` 로 렌더된다. */
  href?: string;
  /** 버튼 동작(선택·열기). `button` 으로 렌더된다. */
  onClick?: () => void;

  /** 스트레치 컨트롤의 접근名. 생략하면 제목 텍스트가 이름이 된다. */
  ariaLabel?: string;
  /**
   * 선택 상태. `onClick` 과 함께 쓰면 `aria-pressed`, `to`/`href` 와 함께 쓰면
   * `aria-current` 로 노출된다. **색만으로 말하지 않는다** — 체크 배지가 함께 뜬다.
   */
  selected?: boolean;
  disabled?: boolean;

  /** 카드 컨테이너 태그. 격자 안에서는 `li`, 단독으로는 `article`(기본). */
  as?: ElementType;
  /** 제목 태그. 문서 개요에 맞춰 고른다(기본 `h3`). */
  titleAs?: 'h2' | 'h3' | 'h4' | 'p';
  /** 투어 앵커. 공용 `Card` 가 가진 슬롯과 같은 이름·같은 이유. */
  dataTour?: string;
  className?: string;
};

export type PickCardGridProps = {
  children: ReactNode;
  /**
   * `data-tint-cluster="pick-grid"` 를 낸다 — 이 격자 안의 **같은 배경값 형제 캡들이 합쳐서
   * 1면**으로 세어진다. 🔴 틴트 캡(`cap.kind === 'tint'`)을 쓰는 격자에는 **필수**다.
   * 값은 부품이 고정한다(라우트당 한 값만 허용되므로 호출부가 고를 여지를 주지 않는다).
   */
  cluster?: boolean;
  /** 열 최소 폭. 기본 260px. */
  minColumnWidth?: string;
  as?: ElementType;
  className?: string;
};
