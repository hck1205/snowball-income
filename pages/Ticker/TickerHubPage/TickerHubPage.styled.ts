import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { PickCard } from '@/components/common';
import {
  DATA_RADIUS,
  PICK,
  appHeaderHeight,
  cardElevation,
  color,
  font,
  iconOpticalAlign,
  media,
  motion,
  radius,
  space,
  subtleScrollbar
} from '@/shared/styles';

/**
 * ── `/ticker/all` 의 지면 설계 ─────────────────────────────────────────────────
 *
 * 이 화면은 **라이브러리의 색인(index)** 이다. 27종을 고르게 하는 것이 유일한 일이고,
 * 그래서 지면이 답해야 하는 질문은 셋이다 — "무엇이 있나 / 어디 있나 / 어떤 게 나은가".
 *
 * 종전 구조는 "히어로 카드 + 카테고리별 카드 나열"이라 셋 중 첫 번째만 답했다. 1280px 에서 문서가
 * 5,393px 이었고(실측 2026-08-03), 특정 티커를 찾는 유일한 방법이 스크롤이었다. 검색으로 들어온
 * 사람은 자기가 찾던 티커가 이 목록에 있는지조차 눈으로 확인해야 했다.
 *
 * 새 구조는 **좌: 색인 레일 / 우: 결과**의 2단이다. 상세 페이지(`/ticker/:name`)가 방금
 * "번호 붙은 목차 레일 + 본문"으로 재편됐고, 허브가 그 어휘를 그대로 쓴다 —
 * 허브에서 카드를 눌러 상세로 들어간 사람이 **같은 골격**을 다시 만난다.
 *
 * ## 상세 페이지와 공유하는 어휘 (한 제품으로 읽히게 하는 장치)
 *  · sticky 색인 레일 + 항목 번호(`01`) + 개수 + 바닥 상시 CTA → 상세의 `TocAside` 와 같은 골격
 *  · 번호 + 헤어라인 머리말(`SectionEyebrow`) → 장이 어디서 시작하는지를 선으로도 말한다
 *  · 라벨 좌 · 값 우 · 행 사이 헤어라인(`SpecTable`) → 매스트헤드 스펙 줄이 같은 문법
 *  · 주역 지표 하나 + 보조 지표 행들(`HeroMetric`) → 카드 안의 지표판이 같은 문법
 *  · 표 보기의 순위·티커·비중 표 → 상세의 `HoldingsTable` 과 같은 문법
 *
 * ## 틴트 면 예산 (tintscan: 화면당 2면) — 실측 기준선 2, 여유 0
 * 이 화면의 채도 면은 **정확히 둘**이고, 그중 하나는 이 화면 것이 아니다.
 *   ① 카드 컬러 캡 — 전 카드가 **같은 배경값**이라 클러스터가 1면으로 접는다(31 → 1, 실측)
 *   ② 공용 `PageFooter`(브랜드 패널) — 이 화면이 고를 수 없는, 페이지 공통으로 딸려오는 면
 *
 * 🔴 그래서 이 파일이 새로 들이는 컨트롤(검색·주기 칩·정렬·보기 전환·색인 레일)은 **전부 중립 면**이다.
 * 색은 폭 180px 미만의 자리(칩·점·번호·귀)와 6px 이하의 줄(리본·레일)에만 싣는다 — 둘 다 면 판정
 * (폭 ≥180px · 높이 ≥8px · 비중립 배경)에 걸리지 않는다. 컨트롤 하나에 틴트 면을 깔고 싶어지면
 * 먼저 tintscan 을 돌려 3이 되는지 확인하라.
 *
 * 🔴 캡 색을 **티커마다 다르게 칠하지 않는 이유**도 여기 있다. tintscan 의 클러스터 접기는
 * "같은 표식값 **+ 같은 배경값**"일 때만 합친다. 27종에 각자의 틴트를 주면 27면으로 세어진다.
 * 그래서 **면은 공유하고, 티커의 색은 면이 아닌 곳**(상단 6px 리본 · 캡 안 잉크 · 심볼 글자 ·
 * 표 행의 3px 귀)에 싣는다.
 */

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
const CAT_VAR = '--tk-cat';
const CAT_COLORS = [color.brandText, color.accentText, color.accentAltText] as const;

/**
 * 3색 순환의 **단일 표**. 여기 없는 카테고리는 0번 색으로 떨어진다(깨지지 않는다).
 *
 * 🔴 색인 레일 항목과 섹션이 **같은 표를 읽어야** 색이 길찾기 단서가 된다. 종전에 칩만
 * `nth-of-type`(=렌더 순서)으로 세었을 때, 비어 있는 카테고리가 걸러지는 순간 둘이 어긋났다
 * (실측 2026-08-03: '리츠(REITs)' 칩은 초록인데 섹션 레일은 파랑). 그래서 레일 항목도
 * **href(=섹션 id)** 로 색을 받는다.
 */
const CAT_GROUP_1 = ['high-dividend', 'reit', 'core-index'] as const;
const CAT_GROUP_2 = ['covered-call', 'international', 'dividend-stock'] as const;

/** 섹션 자신을 고르는 선택자. */
const sectionSelector = (ids: readonly string[]): string => ids.map((id) => `&#${id}`).join(', ');

/** 그 섹션으로 뛰는 해시 앵커를 고르는 선택자. 순서가 아니라 **목적지**로 색을 정한다. */
const anchorSelector = (ids: readonly string[]): string => ids.map((id) => `&[href='#${id}']`).join(', ');

/** 색인 레일 열 폭. 검색 필드 + 두 줄 라벨이 접히지 않는 최소값(상세의 리더 레일 248px 과 같은 계보). */
const RAIL_COLUMN = '264px';

/** 카드 상단 컬러 리본 두께. 🔴 8px 이 되면 tintscan 이 면으로 세기 시작한다 — 6px 을 넘기지 마라. */
const CARD_RIBBON = PICK.railHeight;

/** 격자 열 최소 폭. 레일이 264px 을 먹으므로 종전(272px)보다 좁혀 1280px 에서 3열을 지킨다. */
export const CARD_MIN_WIDTH = '248px';

/* -------------------------------------------------------------------------- */
/* 매스트헤드 — 카드가 아니라 편집면                                             */
/* -------------------------------------------------------------------------- */

/**
 * 지면 머리 — **카드가 아니다.**
 *
 * 종전에는 둥근 상자(테두리 + 반경 20px) 안에 제목·리드·칩·CTA 가 전부 들어 있었다. 그 상자는
 * 아래 카드 30장과 같은 형태 언어라, 화면 맨 위가 "가장 큰 카드"로 읽히고 제목이 카드 제목이 됐다.
 * 여기서는 상자를 걷고 **상단 오로라 줄 + 하단 헤어라인** 사이의 편집면으로 되돌린다 —
 * 신문 매스트헤드의 문법이고, 아래의 카드·표와 형태가 겹치지 않는다.
 */
export const Masthead = styled.header`
  position: relative;
  display: grid;
  gap: ${space[4]};
  padding: clamp(28px, 4vw, 52px) 0 clamp(24px, 3vw, 36px);
  border-bottom: 1px solid ${color.border};

  /* ⚠ 얇은 막대(6px)라 반경을 주지 않는다(radiusShape 가드 §②). 면이 아니라 이 앱의 시그니처 선이다. */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${CARD_RIBBON};
    border-radius: ${radius.pill};
    background: ${color.gradientAurora};
  }
`;

/**
 * 머리말 칩. 폭이 짧아(<180px) 틴트 면으로 세어지지 않는다 — 색면 사다리 L1 이라 예산 밖이다.
 */
export const MastheadEyebrow = styled.p`
  justify-self: start;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  border: 1px solid ${color.brandBorder};
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.02em;
`;

/**
 * 지면 제목.
 *
 * 🔴 종전 clamp 상한은 `5xl`(30.7px 실측)이었다 — 카드 심볼(2xl~3xl)과 겨우 한 단 차이라
 * 화면에 위계가 없었다. 상한을 한 단 더 올려 **제목 → 섹션 제목 → 카드 심볼**이 눈에 순서로 잡히게
 * 한다. 굵기로는 위계를 만들 수 없다(display 서체가 Bold 한 벌이라 600/700/800 이 같게 렌더된다).
 */
export const MastheadTitle = styled.h1`
  margin: 0;
  max-width: 20ch;
  font-size: clamp(${font.size['3xl']}, 5.2vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
`;

export const MastheadLede = styled.p`
  margin: 0;
  max-width: 54ch;
  font-size: clamp(${font.size.md}, 1.6vw, ${font.size.lg});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

/**
 * 라이브러리 스펙 줄 — **읽는 면**이다.
 *
 * 종전 요약은 "27종 수록 · 6개 카테고리" 한 줄이었다. 그건 목차의 정보이지 고르는 데 쓰는 정보가
 * 아니다. 여기서는 상세 페이지의 참고 지표(`SpecTable`)와 **같은 문법**(라벨 위 · 값 아래 ·
 * 칸 사이 헤어라인)으로 배당률 범위·월배당 종목 수까지 낸다 — 이 라이브러리가 무엇을 담고 있는지가
 * 숫자로 먼저 읽힌다.
 */
export const LibrarySpec = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0;
  border-top: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const LibrarySpecItem = styled.div`
  display: grid;
  gap: 4px;
  padding: ${space[3]} ${space[4]} ${space[3]} 0;
  border-bottom: 1px solid ${color.border};
  min-width: 0;
`;

export const LibrarySpecLabel = styled.dt`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${color.textMuted};
`;

/**
 * 스펙 값.
 *
 * 🔴 색은 **중립 고정**이다. 손익색(dataPositive/Negative)도 액센트도 여기 오지 않는다 —
 * 배당률 범위는 포지션이 아니라 사실이고, 색은 아래 카드·레일이 이미 충분히 말한다.
 */
export const LibrarySpecValue = styled.dd`
  margin: 0;
  font-size: clamp(${font.size.lg}, 1.8vw, ${font.size['2xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/* -------------------------------------------------------------------------- */
/* 2단 레이아웃 — 색인 레일 + 결과                                               */
/* -------------------------------------------------------------------------- */

/**
 * 상세 페이지의 `Layout` 과 같은 골격이다(좌 고정폭 레일 + 우 가변 본문, 좁으면 1열).
 * 두 지면이 같은 뼈대를 쓰는 것이 "한 제품"의 가장 값싼 증거다.
 */
export const Layout = styled.div`
  margin-top: clamp(24px, 3.5vw, 40px);
  display: grid;
  grid-template-columns: ${RAIL_COLUMN} minmax(0, 1fr);
  gap: clamp(24px, 3.5vw, 48px);
  align-items: start;

  ${media.down('layout')} {
    grid-template-columns: 1fr;
    margin-top: ${space[4]};
    gap: ${space[4]};
  }
`;

/**
 * 색인 레일 — 이 화면의 조종석.
 *
 * 데스크톱에서는 화면에 **상시 붙어 있는** 사이드바다(sticky). 검색·주기·정렬·보기·카테고리 목차가
 * 한자리에 있어, 27종을 훑는 내내 조건을 바꾸러 위로 올라갈 필요가 없다.
 * 좁은 화면에서는 헤더 바로 아래 붙는 가로 바가 된다 — 상세의 목차 바와 같은 처방이다.
 */
export const IndexRail = styled.aside`
  min-width: 0;
  display: grid;
  gap: ${space[3]};

  /* 레일은 고정폭 트랙 안에 산다 — 자식 하나의 min-content 가 크면 레일 전체가 트랙을 넘친다. */
  > * {
    min-width: 0;
  }

  ${media.up('layout')} {
    position: sticky;
    /* 앱 헤더 **실측 높이** 아래에 붙는다(AppHeader 가 발행). 하드코딩하면 헤더 줄 수가 바뀔 때 어긋난다. */
    top: calc(${appHeaderHeight} + ${space[3]});
    align-self: start;
    padding: ${space[4]};
    border-radius: ${DATA_RADIUS};
    ${cardElevation('base')}
    max-height: calc(100vh - ${appHeaderHeight} - ${space[5]});
    overflow-y: auto;
    ${subtleScrollbar}
  }

  /*
   * 🔴 좁은 화면에서는 **고정하지 않는다.** 이 레일은 검색 + 칩 3개 + 정렬/보기 + 카테고리 칩
   * 6개 + CTA 라 390px 에서 230px 대역이다 — sticky 로 두면 844px 뷰포트의 27% 를 영구히 먹는다
   * (상세 페이지가 목차 바 3줄로 같은 사고를 겪고 칩을 한 단 줄인 이력이 있다). 여기서는 줄일 수
   * 있는 양이 아니므로 고정 자체를 포기하고, 대신 본문 맨 위에 놓아 첫 화면에서 바로 보이게 한다.
   */
  ${media.down('layout')} {
    gap: ${space[3]};
    padding-bottom: ${space[4]};
    border-bottom: 1px solid ${color.border};
  }
`;

/** 레일 안 한 묶음(검색 / 조건 / 목차)의 제목. 좁은 화면에서는 자리를 먹으므로 감춘다. */
export const RailGroupLabel = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${color.textMuted};

  ${media.down('layout')} {
    display: none;
  }
`;

/* ── 검색 ─────────────────────────────────────────────────────────────────── */

/**
 * 검색 필드.
 *
 * 🔴 이 화면에 종전에 **없던 기능**이다. 검색 유입자는 특정 티커(SCHD·JEPI)를 들고 들어오는데,
 * 종전에는 그 티커가 목록에 있는지 확인할 방법이 30장을 눈으로 훑는 것뿐이었다.
 *
 * 면은 중립(`surfaceMuted`)이다 — 폭이 레일 전체(약 232px)라 채도를 깔면 tintscan 의 3번째 면이 된다.
 */
export const SearchField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  padding: 0 ${space[2]} 0 ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  border: 1px solid ${color.border};
  transition: border-color ${motion.fast} ${motion.ease};

  &:focus-within {
    border-color: ${color.brand};
  }
`;

export const SearchGlyph = styled.span`
  ${iconOpticalAlign('sans', font.size.base)}
  display: inline-flex;
  flex: 0 0 auto;
  color: ${color.textMuted};
`;

/**
 * 🔴 `width: 0` + `flex: 1 1 0` 이 핵심이다. `input` 은 `size` 속성 기본값(20자)에서 오는 고유 폭을
 * 갖고, 크롬은 flex 컨테이너의 min-content 를 자식의 **flex base size** 로 잡는다 — `min-width: 0`
 * 만으로는 부족해서 검색 필드의 min-content 가 239px 이 됐고, 264px 레일 안의 auto 트랙이 그만큼
 * 부풀어 레일 전체가 273px 로 넘쳤다(실측 2026-08-03: 개수·보기 전환이 잘려 나갔다).
 */
export const SearchInput = styled.input`
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  padding: 9px 0;
  border: none;
  background: none;
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};

  &::placeholder {
    color: ${color.textMuted};
    font-weight: ${font.weight.regular};
  }

  /* 브라우저 기본 지우기 버튼(Edge/Chrome)은 우리 버튼과 겹치므로 숨긴다. */
  &::-webkit-search-cancel-button {
    display: none;
  }
`;

/** 검색어가 있을 때만 서는 지우기 버튼. 없을 때 자리를 비워 두지 않는다(빈 아이콘 자리는 노이즈다). */
export const SearchClear = styled.button`
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: ${radius.pill};
  background: none;
  color: ${color.textMuted};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }
`;

/* ── 조건 칩·정렬·보기 ────────────────────────────────────────────────────── */

export const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 지급 주기 칩 묶음.
 *
 * 🔴 면은 중립이고, 눌린 칩은 **테두리 굵기와 글자 무게**로 말한다. 폭이 짧아(<180px) 채도를 깔아도
 * 면으로 세어지진 않지만, 눌린 칩만 색면이 되면 그 색이 카테고리 색·티커 색과 세 번째 색 축이 되어
 * 화면의 색 문법이 깨진다. 색 축은 둘로 족하다(카테고리 · 티커).
 */
export const FrequencyChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px ${space[3]};
  border-radius: ${radius.pill};
  cursor: pointer;
  background: ${({ $active }) => ($active ? color.surface : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? color.brand : color.border)};
  color: ${({ $active }) => ($active ? color.text : color.textSecondary)};
  font-size: ${font.size.xs};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.medium)};
  transition: border-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.borderStrong};
    color: ${color.text};
  }
`;

/** 정렬 셀렉트. 네이티브 `select` 라 모바일에서 OS 피커가 뜬다(직접 만든 드롭다운보다 낫다). */
export const SortSelect = styled.select`
  min-width: 0;
  flex: 1 1 auto;
  padding: 7px ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
`;

/**
 * 보기 전환(격자 ⇄ 표) — 이 화면에서 **밀도를 사용자가 고르는** 장치.
 *
 * 카드 격자는 처음 훑을 때 좋고, 표는 27종을 배당률·운용보수로 **비교할 때** 좋다. 둘 중 하나만
 * 두면 반대편 목적이 항상 손해를 본다. 트랙·활성 조각 모두 중립 면이다(예산 0 소모).
 */
export const ViewToggle = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  padding: 2px;
  gap: 2px;
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  border: 1px solid ${color.border};
`;

export const ViewToggleButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px ${space[2]};
  border: none;
  border-radius: ${radius.xs};
  cursor: pointer;
  background: ${({ $active }) => ($active ? color.surface : 'transparent')};
  color: ${({ $active }) => ($active ? color.text : color.textMuted)};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  box-shadow: ${({ $active }) => ($active ? `inset 0 0 0 1px ${color.border}` : 'none')};
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
  }
`;

/* ── 카테고리 색인 ────────────────────────────────────────────────────────── */

export const CategoryNav = styled.nav`
  min-width: 0;
`;

export const CategoryList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1px;

  ${media.down('layout')} {
    /* 좁은 화면: 줄바꿈 칩. sticky 바라 줄이 늘면 본문이 그만큼 영구히 밀린다 — 한 단 작게 잡는다. */
    display: flex;
    flex-wrap: wrap;
    gap: ${space[1]};
  }
`;

/**
 * 색인 항목 — 상세 페이지 목차(`TocButton`)와 **같은 골격**이다: 번호 + 라벨 + 개수.
 *
 * 🔴 여전히 **해시 앵커**(`href="#high-dividend"`)다. 라우터 Link 로 바꾸지 마라 — 같은 문서 안
 * 이동이라 브라우저 기본 동작이 옳고, 아래 섹션의 `scroll-margin-top` 이 고정 헤더를 피한다.
 *
 * 🔴 활성/일치 표시를 **색면으로 하지 않는다**. 이 항목은 데스크톱에서 폭 232px 이라 채도 배경을
 * 깔면 tintscan 의 3번째 면이 된다(예산 여유 0). 대신 왼쪽 3px 컬러 바 + 굵기로 말한다.
 */
export const CategoryLink = styled.a<{ $dimmed: boolean }>`
  ${CAT_VAR}: ${CAT_COLORS[0]};

  position: relative;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: baseline;
  gap: ${space[2]};
  padding: 7px ${space[2]} 7px ${space[3]};
  border-radius: ${radius.sm};
  text-decoration: none;
  color: ${({ $dimmed }) => ($dimmed ? color.textMuted : color.text)};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  opacity: ${({ $dimmed }) => ($dimmed ? 0.55 : 1)};
  transition: background ${motion.fast} ${motion.ease}, opacity ${motion.fast} ${motion.ease};

  /* 카테고리 색 바 — 3px 이라 면으로 세어지지 않는다(색면 사다리 L1). */
  &::before {
    content: '';
    position: absolute;
    inset: 6px auto 6px 0;
    width: 3px;
    border-radius: ${radius.pill};
    background: var(${CAT_VAR});
  }

  ${anchorSelector(CAT_GROUP_1)} {
    ${CAT_VAR}: ${CAT_COLORS[1]};
  }
  ${anchorSelector(CAT_GROUP_2)} {
    ${CAT_VAR}: ${CAT_COLORS[2]};
  }

  &:hover {
    background: ${color.surfaceHover};
    opacity: 1;
  }

  ${media.down('layout')} {
    /* 칩 형태 — 번호와 개수는 남기고 세로 바만 접는다(좁은 화면에서 3px 바는 칩 모서리와 싸운다). */
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px ${space[2]};
    border-radius: ${radius.pill};
    border: 1px solid ${color.border};
    font-size: ${font.size.xs};
    white-space: nowrap;

    &::before {
      inset: auto;
      position: static;
      width: 6px;
      height: 6px;
      flex: 0 0 auto;
    }
  }
`;

/** 색인 번호. 등폭이라 세로로 줄이 선다 — 번호가 곧 이 라이브러리의 뼈대다. */
export const CategoryIndex = styled.span`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  ${font.numeric};

  ${media.down('layout')} {
    display: none;
  }
`;

export const CategoryLinkLabel = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

/**
 * 색인 항목 오른쪽의 개수.
 *
 * 필터가 걸리면 **일치 수 / 전체 수**로 바뀐다 — 조건을 바꿀 때마다 어느 카테고리가 줄었는지가
 * 목록을 내려가지 않아도 레일에서 읽힌다.
 */
export const CategoryLinkCount = styled.span`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  ${font.numeric};
`;

/**
 * 종목 비교(`/ticker/compare`) 진입 링크 — 이 화면의 **유일한 L3 솔리드 면**이다.
 *
 * 🔴 `CategoryNav` 안에 넣지 마라. 그 nav 는 "카테고리 바로가기"라는 이름을 달고 있어, 스크린리더
 * 사용자가 목록을 훑을 때 **같은 문서 안 이동만** 나오리라 기대한다 — 다른 라우트로 나가는 링크가
 * 섞이면 그 약속이 깨진다. 구조는 테스트가 잠근다(TickerHubPage.test.tsx).
 *
 * 🔴 솔리드 채움은 **brand 축 하나만** 합법이다(accent/accentAlt/identity 를 채우면 16테마 중
 * 최소 하나가 대비를 잃는다). 폭은 레일 전체지만 높이·색이 아니라 **폭 180px 미만**이 관건이라
 * 레일 안(232px)에서는 면으로 세어질 수 있다 — 그래서 내용 폭으로만 넓어지게 둔다.
 */
export const CompareLink = styled(Link)`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid transparent;
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
    }
  }
`;

/** 레일 안 묶음 사이 구분선. 상세 목차의 부록 구분선과 같은 처방(글자가 아니라 선으로 가른다). */
export const RailDivider = styled.hr`
  margin: ${space[1]} 0;
  height: 1px;
  border: none;
  background: ${color.border};

  ${media.down('layout')} {
    display: none;
  }
`;

/* -------------------------------------------------------------------------- */
/* 결과 영역                                                                    */
/* -------------------------------------------------------------------------- */

export const Results = styled.div`
  min-width: 0;
  display: grid;
  gap: clamp(28px, 4vw, 44px);
`;

/**
 * 결과 요약 줄 — 조건을 바꿨을 때 **무슨 일이 일어났는지**를 문장으로 말한다.
 * `role="status"` 라 스크린리더 사용자도 필터 결과를 듣는다(호출부가 건다).
 */
export const ResultSummary = styled.p`
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
  font-size: ${font.size.sm};
  color: ${color.textSecondary};

  /* 요약 줄에서만 지우기 버튼이 오른쪽 끝으로 간다 — 빈 상태의 같은 버튼은 가운데 정렬이다. */
  > button {
    margin-left: auto;
  }
`;

export const ResultCount = styled.strong`
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  ${font.numeric};
`;

/** 요약 줄 안의 조건 배지 — 지금 무엇으로 거르고 있는지를 글자로 되뇐다(색 단독 채널 금지). */
export const ResultChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.text};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
`;

export const ResetButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.borderStrong};
    background: ${color.surfaceHover};
  }
`;

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

/** 섹션 종목 수 — 값은 중립색이다(색은 칩의 테두리·앞 글리프 같은 크롬에만). */
export const SectionCount = styled.span`
  ${iconOpticalAlign('display', SECTION_TITLE_SIZE)}
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid color-mix(in srgb, var(${CAT_VAR}) 32%, transparent);
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
`;

/**
 * 카테고리 안에 결과가 없을 때의 한 줄.
 *
 * 🔴 섹션 자체는 남는다 — 이 자리가 해시 앵커의 목적지라, 필터에 따라 섹션이 사라지면 색인 링크가
 * 조용히 아무 데도 못 간다. 초라해 보이지 않게 점선 테두리와 한 문장을 준다.
 */
export const SectionEmpty = styled.p`
  margin: 0;
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px dashed ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

/* -------------------------------------------------------------------------- */
/* 카드 — 고르는 면                                                             */
/* -------------------------------------------------------------------------- */

/**
 * 티커 하나의 **색 스코프**이자 격자 셀.
 *
 * 뷰가 인라인 스타일로 원시 액센트와 `assignSeries` 폴백을 얹고, 여기서 파생 변수를 만든다 —
 * 상세 페이지의 `AccentScope` 와 **같은 변수 이름**(`--tk-text`)이라 같은 티커가 두 화면에서
 * 같은 색으로 읽힌다.
 *
 * 🔴 `--tk-cap-fill` 만은 **티커와 무관한 공유 값**이다. 캡 배경이 카드마다 다르면 tintscan
 * 클러스터가 접지 못한다(파일 머리말의 예산 설명을 보라).
 */
/**
 * 원시 액센트(`--tk-from/to/text-light/text-dark`) → **테마 인지 파생 변수**.
 *
 * 🔴 카드(`CardScope`)와 표 행(`TableRow`)이 **같은 블록을 공유해야 한다.** 종전에 카드에만
 * 두었더니, 표 보기의 행은 원시 변수만 받고 파생이 없어 티커 색 귀가 통째로 그려지지 않았다
 * (실측 2026-08-03: `--tk-ribbon-from` 미정의 → linear-gradient 무효 → 귀 0px).
 * 파생 이름은 상세 페이지의 `AccentScope` 와 같다 — 같은 티커가 세 지면에서 같은 색으로 읽힌다.
 */
const ACCENT_DERIVATION = `
  --tk-ink: var(--tk-fallback, ${color.brandText});
  --tk-text: var(--tk-text-light, var(--tk-ink));
  --tk-ribbon-from: var(--tk-from, var(--tk-ink));
  --tk-ribbon-to: var(--tk-to, var(--tk-ink));

  @media (prefers-color-scheme: dark) {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }

  /*
   * 팔레트 시스템의 강제 테마 오버라이드(data-theme)와도 정합을 맞춘다.
   *
   * 🔴 조상 선택자는 반드시 'html[...]' 로 쓴다 — ':root[...] &' 는 **동작하지 않는다.**
   * stylis 는 콜론으로 시작하는 중첩 선택자를 "부모에 붙는 의사선택자"로 보고 부모를 앞에
   * 덧붙이는데, 그 결과가 '.css-x:root[data-theme="dark"] .css-x' 라 **영원히 매치되지 않는다**
   * (2026-07-30 실측: 강제 다크에서 액센트 텍스트가 라이트 값으로 남는다).
   */
  html[data-theme='light'] & {
    --tk-text: var(--tk-text-light, var(--tk-ink));
  }
  html[data-theme='dark'] & {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }
`;

export const CardScope = styled.li`
  display: grid;
  min-width: 0;

  ${ACCENT_DERIVATION}

  /* 전 카드가 같은 값을 낸다 — 클러스터가 1면으로 접는 조건. */
  --tk-cap-fill: ${color.brandSubtle};
`;

/**
 * 허브가 쓰는 고르는 카드 = 공용 `PickCard` + **그 티커만의 상단 리본**.
 *
 * 리본을 의사요소로 그리는 이유가 둘이다.
 *  ① tintscan 은 DOM 만 열거한다 — 의사요소는 애초에 세어지지 않는다.
 *  ② 6px 은 면 하한(8px)보다 낮아, DOM 이었더라도 선으로 남는다. 즉 **두 겹으로 안전하다.**
 */
export const HubPickCard = styled(PickCard)`
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${CARD_RIBBON};
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(90deg, var(--tk-ribbon-from), var(--tk-ribbon-to));
  }
`;

/**
 * 카드 제목 자리에 서는 티커 심볼. 그 티커의 색을 입는다 — 같은 티커의 상세 히어로와 색이 이어진다.
 *
 * ⚠ 이 요소가 카드 링크의 **접근 가능한 이름**이다(스트레치 컨트롤이 제목을 감싼다).
 * 심볼을 여기서 빼면 스크린리더 사용자가 카드를 티커로 구분하지 못한다.
 */
export const CardSymbol = styled.span`
  font-size: clamp(${font.size.xl}, 2vw, ${font.size['2xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  color: var(--tk-text);
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/**
 * 한글명 · 영문명 — 한 줄로 자르고 넘치면 말줄임.
 *
 * 🔴 `white-space: nowrap` 으로 자르지 마라. 부모(공용 `PickCardSubtitle`)는 격자 아이템의 기본
 * `min-width: auto` 를 갖는다 — nowrap 은 그 아이템의 **최소 크기를 글자 전체 폭으로** 만들어
 * 부모가 카드 밖으로 부푼다(실측 2026-08-03: 8장 중 7장이 카드를 넘겼다).
 * `overflow-wrap: anywhere` 가 핵심이다 — 최소 크기 계산에 반영되어 긴 영문명도 부모를 밀지 못한다.
 */
export const CardNames = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

export const CardBody = styled.div`
  container-type: inline-size;
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 소개 한 줄.
 *
 * 🔴 종전에는 2줄 고정(min-height 로 자리를 잡아 스탯 줄을 맞췄다)이었다. 30장 × 한 줄만큼의
 * 세로가 그대로 스크롤이 되고, 어차피 대부분 잘려서 문장이 완결되지 않았다. 한 줄로 줄이고
 * 아래 지표판을 격자로 고정해 같은 정렬을 얻는다 — 정렬은 지키고 높이는 돌려받는다.
 */
export const CardTagline = styled.p`
  margin: 0;
  min-width: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(${font.size.xs} * ${font.leading.snug});
`;

/**
 * 카드 안의 지표판 — 카드 안의 **읽는 자리**다.
 *
 * 상세 히어로의 `HeroMetric` 과 같은 문법: **주역 하나 + 보조 행들**. 종전에는 배당률·운용보수·지급
 * 셋이 같은 크기로 나란했는데, 배당 소개 목록에서 먼저 읽혀야 할 숫자는 하나다 — 셋을 같은 무게로
 * 늘어놓으면 그 하나가 사라진다.
 *
 * 🔴 면이 중립(채도 0)인 것은 규율이다. 고르는 카드 안이라도 숫자가 앉는 자리에는 채도 면을 깔지
 * 않는다(SurfaceKind 2분법). 종전의 `surfaceMuted` 블록도 걷어 헤어라인만 남겼다.
 */
export const CardMetric = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;

  @container (max-width: 210px) {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }
`;

export const CardMetricLead = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const CardMetricLabel = styled.dt`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  white-space: nowrap;
`;

/**
 * 주역 지표(배당률).
 *
 * 🔴 색은 **중립 고정**이다 — 숫자에 accent·손익색은 확정 금지(색은 배지·아이콘·크롬에만).
 * 카테고리 색(`--tk-cat`)이나 티커 액센트(`--tk-text`)를 여기에 연결하지 마라.
 */
export const CardMetricValue = styled.dd`
  margin: 0;
  font-size: clamp(${font.size.xl}, 9cqi, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${color.text};
  ${font.numeric};
`;

/**
 * 보조 지표 행들 — 라벨 좌 · 값 우(상세의 `HeroMetricRows` 와 같은 문법).
 *
 * 🔴 왼쪽 세로 헤어라인이 **주역과 보조를 가르는 유일한 장치**다. 없으면 두 열의 글자들이 한 행처럼
 * 가로로 읽혀 "배당률 · 운용보수 0.06%" 가 한 문장이 된다(실측 2026-08-03, 1280px 카드 3열).
 */
export const CardMetricRows = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;
  padding-left: ${space[3]};
  border-left: 1px solid ${color.border};

  @container (max-width: 210px) {
    padding-left: 0;
    padding-top: ${space[2]};
    border-left: none;
    border-top: 1px solid ${color.border};
  }
`;

export const CardMetricRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const CardMetricRowLabel = styled.dt`
  margin: 0;
  flex: 0 0 auto;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const CardMetricRowValue = styled.dd`
  margin: 0;
  min-width: 0;
  text-align: right;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/** 캡 안 라벨(카테고리명) — 좁은 카드에서 잘리지 않게 크기를 한 단 낮춘다. */
export const CapLabel = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/* -------------------------------------------------------------------------- */
/* 표 보기 — 읽는 면                                                             */
/* -------------------------------------------------------------------------- */

/**
 * 표 보기의 바깥 상자. 좁은 화면에서 표가 지면을 밀지 않게 **자기 안에서만** 가로로 흐른다.
 */
export const TableScroll = styled.div`
  min-width: 0;
  overflow-x: auto;
  ${subtleScrollbar}
`;

/**
 * 티커 표 — 상세 페이지의 `HoldingsTable` 과 **같은 문법**이다(머리 행 · 헤어라인 · 값 우측정렬 ·
 * 등폭 숫자). 27종을 배당률·운용보수로 **비교할 때** 카드 격자보다 압도적으로 빠르다.
 *
 * 🔴 티커 셀은 여전히 상세로 가는 **링크**다. 보기를 바꿔도 진입점은 하나도 줄지 않는다.
 */
export const TickerTable = styled.table`
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: ${font.size.sm};

  caption {
    text-align: left;
    padding-bottom: ${space[2]};
    color: ${color.textMuted};
    font-size: ${font.size.xs};
  }

  thead th {
    padding: ${space[2]} ${space[3]};
    border-bottom: 1px solid ${color.borderStrong};
    background: ${color.surfaceMuted};
    color: ${color.textMuted};
    font-size: ${font.size['2xs']};
    font-weight: ${font.weight.bold};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: left;
    white-space: nowrap;
  }

  thead th:nth-of-type(n + 3) {
    text-align: right;
  }

  tbody tr {
    border-bottom: 1px solid ${color.border};
    transition: background ${motion.fast} ${motion.ease};
  }

  tbody tr:hover {
    background: ${color.surfaceHover};
  }

  tbody td {
    padding: ${space[3]};
    color: ${color.text};
    vertical-align: middle;
  }
`;

/** 표의 한 행 — 카드와 **같은 파생 블록**을 받아 티커 색이 두 보기에서 어긋나지 않는다. */
export const TableRow = styled.tr`
  ${ACCENT_DERIVATION}
`;

/**
 * 티커 셀 — 왼쪽 3px 컬러 귀 + 심볼 링크.
 * 귀는 폭 3px 이라 면으로 세어지지 않는다(색면 사다리 L1). 색은 카드 리본과 같은 값이다.
 */
export const TableTickerCell = styled.td`
  position: relative;
  padding-left: calc(${space[3]} + 7px) !important;
  white-space: nowrap;

  &::before {
    content: '';
    position: absolute;
    inset: 10px auto 10px 0;
    width: 3px;
    border-radius: ${radius.pill};
    background: linear-gradient(180deg, var(--tk-ribbon-from), var(--tk-ribbon-to));
  }
`;

export const TableTickerLink = styled(Link)`
  color: var(--tk-text);
  font-size: ${font.size.base};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  text-decoration: none;
  ${font.numeric};

  &:hover {
    text-decoration: underline;
  }
`;

/** 종목명 셀 — 한글명 위, 영문명 아래. 좁을 때 둘 다 한 줄로 자른다. */
export const TableNameCell = styled.td`
  min-width: 0;
  max-width: 260px;
`;

export const TableKorean = styled.span`
  display: block;
  font-weight: ${font.weight.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TableEnglish = styled.span`
  display: block;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 숫자 셀 — 우측정렬 + 등폭. 열이 한 축에 서야 위아래로 비교가 된다. */
export const TableNumberCell = styled.td`
  text-align: right;
  white-space: nowrap;
  font-weight: ${font.weight.bold};
  ${font.numeric};
`;

/** 값이 없는 칸. `-` 를 숫자처럼 굵게 쓰지 않는다 — 없는 값은 없어 보여야 한다. */
export const TableMuted = styled.span`
  color: ${color.textMuted};
  font-weight: ${font.weight.regular};
`;

/* -------------------------------------------------------------------------- */
/* 빈 상태                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 검색·필터가 아무것도 못 찾았을 때 — 이 화면에서 **가장 자주 방치되는 자리**다.
 *
 * 종전 빈 상태는 회색 점선 상자 안의 한 문장뿐이었다(그마저도 레지스트리가 통째로 빌 때만 떴다).
 * 여기서는 마스코트 + 무엇을 어떻게 바꾸면 되는지 + **바로 누를 수 있는 대안 티커 3종**을 준다.
 * 빈 화면이 막다른 길이 되지 않게 하는 것이 이 블록의 유일한 일이다.
 *
 * ⚠ 면은 중립이다(마스코트가 서는 브랜드 표면이지만 채도 면은 아니다) — 예산 여유가 0 이다.
 */
export const EmptyState = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: clamp(32px, 5vw, 56px) ${space[4]};
  border-radius: ${DATA_RADIUS};
  border: 1px dashed ${color.borderStrong};
  background: ${color.surface};
  text-align: center;
`;

export const EmptyGlyph = styled.span`
  display: inline-flex;
  color: ${color.identity};
`;

/**
 * 빈 상태 제목 — 전 화면 공통 곡선 `clamp(2xl, 2.6vw, 4xl)`(20~30px).
 * 종전 `clamp(lg, 2vw, 2xl)` 은 @1280 에서 20px 이라 **바로 아래 티커 카드 제목(20px)과 같은 크기**였다.
 * 같은 크기는 위계가 아니다 — 빈 상태에서 제일 먼저 읽혀야 할 문장이 카드 한 장과 동급이었다.
 */
export const EmptyTitle = styled.p`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
`;

export const EmptyText = styled.p`
  margin: 0;
  max-width: 44ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  word-break: keep-all;
`;

export const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${space[2]};
  margin-top: ${space[1]};
`;

/** 빈 상태의 대안 티커 칩 — 폭이 짧아(<180px) 면으로 세어지지 않는다. */
export const EmptySuggestion = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  ${font.numeric};
  transition: border-color ${motion.fast} ${motion.ease}, background ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
    background: ${color.surfaceHover};
  }
`;
