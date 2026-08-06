import { PICK, color } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 색 축 · 기하 상수                                                            */
/* -------------------------------------------------------------------------- */

/**
 * 카테고리 색 순환 — 색인 레일 항목·섹션 머리말·개수 칩이 전부 이 변수를 읽는다.
 * 색이 장식이 아니라 **길찾기 단서**가 되게 하는 장치다.
 *
 * ⚠ 3색은 프리셋의 brand/accent/accentAlt 라 velog(기본)에서는 셋 다 초록 계열이다 —
 * 색상군이 하나인 프리셋의 의도된 결과이고, navy-gold·grape·sunset 에서는 확실히 갈린다.
 * 전경으로도 쓰이므로 solid 가 아니라 대비 검증된 `*Text` 계열을 넣는다.
 */
export const CAT_VAR = '--tk-cat';
export const CAT_COLORS = [color.brandText, color.accentText, color.accentAltText] as const;

/**
 * 3색 순환의 **단일 표**. 여기 없는 카테고리는 0번 색으로 떨어진다(깨지지 않는다).
 *
 * 🔴 색인 레일 항목과 섹션이 **같은 표를 읽어야** 색이 길찾기 단서가 된다. 종전에 칩만
 * `nth-of-type`(=렌더 순서)으로 세었을 때, 비어 있는 카테고리가 걸러지는 순간 둘이 어긋났다
 * (실측 2026-08-03: '리츠(REITs)' 칩은 초록인데 섹션 레일은 파랑). 그래서 레일 항목도
 * **href(=섹션 id)** 로 색을 받는다.
 */
export const CAT_GROUP_1 = ['high-dividend', 'reit', 'core-index'] as const;
export const CAT_GROUP_2 = ['covered-call', 'international', 'dividend-stock'] as const;

/** 섹션 자신을 고르는 선택자. */
export const sectionSelector = (ids: readonly string[]): string => ids.map((id) => `&#${id}`).join(', ');

/** 그 섹션으로 뛰는 해시 앵커를 고르는 선택자. 순서가 아니라 **목적지**로 색을 정한다. */
export const anchorSelector = (ids: readonly string[]): string => ids.map((id) => `&[href='#${id}']`).join(', ');

/** 색인 레일 열 폭. 검색 필드 + 두 줄 라벨이 접히지 않는 최소값(상세의 리더 레일 248px 과 같은 계보). */
export const RAIL_COLUMN = '264px';

/** 카드 상단 컬러 리본 두께. 🔴 8px 이 되면 tintscan 이 면으로 세기 시작한다 — 6px 을 넘기지 마라. */
export const CARD_RIBBON = PICK.railHeight;

/** 격자 열 최소 폭. 레일이 264px 을 먹으므로 종전(272px)보다 좁혀 1280px 에서 3열을 지킨다. */
export const CARD_MIN_WIDTH = '248px';
