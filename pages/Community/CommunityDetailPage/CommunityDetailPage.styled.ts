import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  appHeaderHeight,
  color,
  font,
  iconOpticalAlign,
  media,
  motion,
  pageHue,
  radius,
  shadow,
  space,
  zIndex
} from '@/shared/styles';

/**
 * ── 글 상세의 레이아웃 (2026-08-03 리워크) ──────────────────────────────────────
 *
 * 그전에는 **모든 것이 같은 흰 카드**였다: 제목·메타·본문·첨부·좋아요가 한 장, 댓글이 또 한 장.
 * 두 장 다 `surface + 1px border + shadow.e1` 이라 화면에 위계가 없었다 — 제목과 댓글 입력칸이
 * 같은 무게로 서 있었다.
 *
 * 지금은 **세 개의 다른 지면**으로 갈랐다.
 *
 * | 층 | 무엇 | 수단 |
 * |---|---|---|
 * | 머리글(Masthead) | 제목·작성자 | **카드 없음.** 배경 위에 그대로 — 화면에서 가장 큰 타이포가 배경과 직접 만난다 |
 * | 본문(BodyGrid) | 산문 + 첨부 + 액션 레일 | 좌측 72px 레일(좋아요·공유) + 본문 칼럼의 2열. 레일은 sticky |
 * | 댓글(CommentsBand) | 대화 | `surfaceSunken` 슬래브 — 본문에서 **가라앉혀** 성격이 다른 지면임을 면색으로 말한다 |
 *
 * 🔴 `Article` 은 `DetailShell` 의 **직계 자식**이어야 한다 — 상단 바와 같은 부모라는 구조를
 * `test/community/communityDetailTopBar.test.ts` 가 고정한다(좌우 경계 정합).
 */

export const DetailShell = styled.div`
  /*
   * 🔴 폭 제한을 두지 않는다 — 셸('CommunityMain')이 앱 공통 1200px 로 잡는다.
   * 글줄 길이는 폭이 아니라 'RichTextContent' 의 72ch 상한이 맡는다("지면은 넓게, 읽는 줄만 짧게").
   */
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
`;

export const Article = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(${space[8]}, 5vw, ${space[16]});
`;

/* ── 머리글 ──────────────────────────────────────────────────────────────────
 * 카드를 벗겼다. 이 화면에서 가장 먼저 눈에 들어와야 하는 것은 제목이고, 그러려면 제목이
 * 테두리·그림자와 무게를 다투지 않아야 한다. */

export const Masthead = styled.header`
  display: grid;
  gap: ${space[5]};
  padding-bottom: ${space[6]};
  border-bottom: 1px solid ${color.border};
`;

/**
 * 제목 위 짧은 컬러 막대. 높이 6px 라 `tintscan` 의 면 하한(8px)에 걸리지 않는다 —
 * 선(L1)이지 면이 아니다. 폭도 48px 로 못 박아 두 조건 모두에서 안전하다.
 */
export const Kicker = styled.div`
  width: 48px;
  height: 6px;
  border-radius: ${radius.pill};
  background: ${pageHue};
`;

export const Title = styled.h1`
  margin: 0;
  /* 헤드라인 글줄. ch 는 '0' 자 폭(≈0.5em)이라 한글 기준으로는 이 값의 절반 글자 수다 — 실측상
     1280px 에서 두세 줄로 앉는다(한 줄짜리 헤드라인은 이 크기에서 오히려 허전하다). */
  max-width: 24ch;
  color: ${color.text};
  /*
   * 그전에는 20~24px 였다 — 본문(15px)과 5px 차이라 "제목처럼 생긴 문단"이었다.
   * 26~44px 로 벌리면 본문과의 비가 1.6~2.75 가 되어 스캔할 때 제목이 먼저 잡힌다.
   */
  font-size: clamp(${font.size['3xl']}, 4.6vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  line-height: 1.18;
  letter-spacing: -0.03em;
  word-break: keep-all;
  overflow-wrap: anywhere;

  ${media.down('mobileWide')} {
    max-width: none;
  }
`;

/** 작성자 줄 — 아바타를 **거터 칼럼**으로 빼서 이름/메타 두 줄이 아바타 오른쪽에 정렬된다. */
export const Byline = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: ${space[3]};
  row-gap: 2px;
`;

export const BylineAvatar = styled.div`
  grid-row: span 2;
  display: flex;
`;

export const AuthorName = styled.b`
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/** 시간 · 조회수 — 가장 약한 위계. 숫자는 tabular 로 자릿수를 세운다. */
export const BylineMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  ${font.numeric}

  time {
    color: ${color.textMuted};
  }
`;

export const Dot = styled.span`
  color: ${color.border};
`;

/* ── 본문 + 액션 레일 ────────────────────────────────────────────────────────
 * 🔴 DOM 순서는 [본문][레일] 이다. 모바일에서는 그 순서 그대로 흐르고(= 기존 배치),
 * 데스크톱에서만 'grid-template-areas' 가 레일을 왼쪽으로 옮긴다.
 * 이렇게 하면 좁은 화면의 탭 순서가 "읽고 나서 반응한다"로 자연스럽게 남는다. */

export const BodyGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'body' 'rail';
  gap: ${space[6]};

  /*
   * 🔴 데스크톱에서도 **한 칸**이다. 반응 레일은 자리를 차지하지 않고 왼쪽 바깥으로 뜬다
   * (ActionRail 주석 참고) — 그래야 본문이 레일 폭만큼 밀리지 않는다.
   * 레일은 본문과 같은 칸에 겹쳐 앉은 뒤 음수 마진으로 왼쪽 바깥으로 나간다(ActionRail 참고).
   * ⚠ 레일이 카드 바깥 왼쪽에 서므로 그 폭(72 + gap)만큼 **페이지 좌여백이 필요**하다.
   *   실측: 1600px 에서 좌여백 213px(충분) · 1280px 에서 53px(부족). 그래서 이 배치는
   *   좌여백이 확보되는 폭에서만 켠다 — 기준이 layout(980)이 아니라 outerRail(1384)인 이유다.
   */

  ${media.up('outerRail')} {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'body';
    gap: clamp(${space[6]}, 3vw, ${space[10]});
  }
`;

export const BodyColumn = styled.div`
  grid-area: body;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(${space[8]}, 4vw, ${space[12]});
`;

/**
 * 좋아요·공유가 사는 자리.
 *
 * 데스크톱: 본문 왼쪽 여백에 **세로로 서서 따라 내려온다**(sticky). 긴 글을 읽는 도중 어디서든
 * 손이 닿는다 — 그전에는 본문 맨 끝까지 스크롤해야만 좋아요가 보였다.
 * 모바일: 본문 아래 가로 줄(기존 자리). 위에 hairline 을 그어 본문과 갈라 둔다.
 */
export const ActionRail = styled.div`
  grid-area: rail;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  padding-top: ${space[5]};
  border-top: 1px solid ${color.border};

  /*
   * 🔴 데스크톱에서 **뜬다**(2026-08-04 사용자 지시: "like share 가 floating 으로 자리를 잡아야
   * 하는데 지금은 그 영역만큼 컨텐츠가 오른쪽으로 밀렸다").
   *
   * 종전에는 BodyGrid 의 첫 칸(72px)을 차지해 본문을 그만큼 오른쪽으로 밀었다 —
   * 실측 1280px: 본문 단락이 x=162 에서 시작(레일 72 + gap 40).
   * absolute 로 띄우면 그 칸이 사라져 본문이 카드 왼쪽 끝에서 시작한다.
   *
   * ⚠ sticky 를 absolute 로 바꾸면 스크롤을 따라오지 않는다. 그래서 **자리는 absolute 로 잡되
   *   안쪽 알약 묶음이 sticky** 다 — 레일 자체는 본문 높이만큼 늘어나 있고 그 안에서 붙어 다닌다.
   * ⚠ 부모(BodyGrid)가 position: relative 여야 한다. 그쪽 주석 참고.
   */
  ${media.up('outerRail')} {
    /*
     * 🔴 본문과 **같은 격자 칸**에 앉힌 뒤 왼쪽 바깥으로 당긴다.
     * 자기 칸(72px)을 갖지 않으므로 본문이 밀리지 않고, 그러면서도 flow 안에 남아 sticky 가 산다
     * (absolute 로 띄우면 스크롤을 안 따라온다 — 이 레일의 존재 이유가 "긴 글 도중에도 손이 닿는 것"이다).
     * ⚠ align-self: start + height: max-content 가 없으면 격자가 레일을 본문 높이만큼 늘려
     *   sticky 가 움직일 구간이 사라진다.
     */
    grid-area: body;
    justify-self: start;
    align-self: start;
    height: max-content;
    margin-left: calc(-72px - clamp(${space[6]}, 3vw, ${space[10]}));
    position: sticky;
    /* 헤더 아래 한 칸. CSS 변수명을 직접 쓰지 않고 토큰 appHeaderHeight 를 쓴다 —
       AppHeader 가 실측해 발행하는 그 변수의 이름은 shared/styles 가 소유한다. */
    top: calc(${appHeaderHeight} + ${space[5]});
    flex-direction: column;
    align-items: center;
    width: 72px;
    padding-top: 0;
    border-top: none;
  }
`;

/**
 * 레일 안 공유 버튼 — 데스크톱에서는 아이콘 위/라벨 아래의 **세로 칩**이 된다.
 * 좋아요(가로 pill)와 형태가 갈리지만, 둘 다 72px 폭에 정확히 앉는다.
 */
/**
 * 공유 — **아이콘 전용**이다(2026-08-04 사용자 지시로 "공유" 글자를 걷었다).
 * 🔴 그래서 정사각이다. 글자를 뺐는데 좌우 패딩을 두면 폭만 72px 로 남아 옆의 좋아요(56px)와
 *   무게가 갈린다(실측). 아이콘 크기도 LikeButton md 와 같은 `ICON.lg`(18) 를 쓴다.
 * ⚠ 이름은 `aria-label` 이 진다 — 지우지 마라. 아이콘만 남은 버튼은 그것 말고 이름이 없다.
 */
export const ShareButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: ${radius.pill};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
    color: ${color.brand};
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  svg {
    flex: 0 0 auto;
  }

  /*
   * 🔴 데스크톱에서 폭을 늘리지 않는다. 종전에는 여기서 width: 100% + 세로 스택 + 글자를 줘서
   * 레일 폭(72px)만큼 벌어졌는데, 글자를 걷은 지금은 늘릴 이유가 없고 옆의 좋아요(56px)와
   * 무게만 갈렸다(실측 72 vs 56). 두 버튼 다 36px 높이의 알약이라 같은 규격으로 둔다.
   */
`;

/** 데스크톱 레일에서 좋아요 pill 을 칼럼 가운데로 세운다(가로 pill 이라 폭이 72px 보다 좁다). */
export const RailLike = styled.div`
  display: flex;

  ${media.up('layout')} {
    justify-content: center;
  }
`;

/* ── 첨부 시뮬레이션 ─────────────────────────────────────────────────────────
 * 그전에는 "티커 5개 · 초기 1,000만 · 월 100만" 이 **한 줄 회색 텍스트**였다. 이 글이 다루는
 * 조건 자체인데 가장 약한 위계에 있었다. 3칸 스탯 격자(라벨 위 / 값 아래)로 올린다. */

export const AttachCard = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  overflow: hidden;
`;

/** 카드 머리의 6px 컬러 줄 — 높이 6 < 8 이라 면으로 세어지지 않는다(선이다). */
export const AttachRail = styled.div`
  height: 6px;
  background: ${pageHue};
`;

export const AttachHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[4]};
  flex-wrap: wrap;
  padding: clamp(${space[4]}, 3vw, ${space[6]}) clamp(${space[4]}, 3vw, ${space[6]}) 0;
`;

export const AttachTitle = styled.h2`
  margin: 0;
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/**
 * CTA 버튼을 제목의 **잉크 중심**에 맞춘다.
 *
 * 제목은 h2 라 헤딩 서체(font.display = Gmarket 계열)로 그려지고, 그 서체는 잉크 중심이 라인박스
 * 중심보다 0.100em 위다(한글에 디센더가 없는데 폰트가 디센더 공간을 크게 잡는다).
 * 그래서 align-items: center 만으로는 버튼이 **2.27px 아래**로 앉는다(uiprobe --align 실측).
 * 🔴 line-height 로는 못 고친다 — 콘텐츠 영역의 중심은 line-height 와 무관하다.
 */
export const AttachAction = styled.div`
  ${iconOpticalAlign('display', font.size.xl)}
`;

/** 조건 3종. `dl` 인 이유는 라벨-값 쌍이기 때문이고, 격자인 이유는 셋을 나란히 비교하기 때문이다. */
export const AttachStats = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[3]};
  margin: 0;
  padding: clamp(${space[4]}, 3vw, ${space[5]}) clamp(${space[4]}, 3vw, ${space[6]});

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }
`;

export const AttachStat = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};

  dt {
    color: ${color.textMuted};
    font-size: ${font.size['2xs']};
    font-weight: ${font.weight.semibold};
    letter-spacing: 0.04em;
  }

  dd {
    margin: 0;
    color: ${color.text};
    font-size: ${font.size.lg};
    font-weight: ${font.weight.bold};
    ${font.numeric}
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/* ── 댓글 슬래브 ─────────────────────────────────────────────────────────────
 * 카드가 아니라 **가라앉은 지면**이다. 본문(카드 없음)과 면색으로 갈려 "여기부터는 대화"가
 * 읽는 순간 전달된다. `cardElevation('sunken')` 과 같은 수단(면색 하나)이다. */

/**
 * 댓글 슬래브.
 *
 * 🔴 **본문 열에 맞춰 선다**(2026-08-04 사용자 지시: "좌우로 꽉차있다").
 * 이 요소는 `BodyGrid` **밖**이라 그냥 두면 카드 전폭을 쓴다 — 실측(1280px): 본문 단락이 810px
 * (x=162)인데 댓글은 1080px(x=93)로 양쪽 다 더 넓게 서서, 같은 글의 두 부분이 서로 다른 폭이었다.
 * `BodyGrid` 와 **같은 격자**를 다시 깔아 두 번째 칸에 앉힌다 — 값을 손으로 베끼지 않고
 * 같은 규칙을 쓰므로 레일 폭이 바뀌어도 따라간다.
 *
 * ⚠ 좁은 폭(`layout` 미만)에서는 `BodyGrid` 도 한 칸이므로 여기서도 격자를 걸지 않는다.
 */
/**
 * 댓글 슬래브.
 *
 * 🔴 **본문과 같은 왼쪽 끝에서 시작한다** — 별도 보정을 두지 않는다(2026-08-04).
 * 잠깐 `margin-left: calc(72px + gap)` 을 뒀던 적이 있는데, 그건 반응 레일이 격자의 첫 칸을
 * 차지해 본문을 밀던 시절의 보정이었다. 레일이 카드 바깥으로 뜨면서 본문이 카드 왼쪽 끝에서
 * 시작하게 됐고(실측 1280px: 본문 x 162 → 53), 그 보정이 남아 있으면 이번엔 댓글만 오른쪽으로
 * 밀린다. 두 부분은 같은 글의 이어지는 면이라 왼쪽 끝이 같아야 한다.
 *
 * ⚠ 레일 배치를 되돌리면 이 보정도 함께 되살려야 한다 — 둘은 한 쌍이다.
 */
export const CommentsBand = styled.div`
  /*
   * 🔴 면(슬래브)을 걷고 **본문 흐름에 그대로 잇는다**(2026-08-04 사용자 지시:
   * "content 글 위치에 맞게 align").
   *
   * 종전에는 'surfaceSunken' 배경 + 좌우 패딩 40px 짜리 판이었다. 그 패딩 때문에 댓글 제목이
   * 본문보다 **40px 오른쪽**에서 시작했다(실측 1280px: 본문 x 53 · 댓글 x 93). 판을 유지한 채
   * 맞추려면 음수 마진으로 판을 카드 밖으로 빼야 하는데, 그러면 판이 카드보다 넓어진다.
   *
   * 판이 없어도 손해가 없다 — 위쪽 헤어라인과 여백이 "여기서부터 댓글"을 충분히 말한다.
   * 게다가 이 화면의 면 예산(tintscan)도 그만큼 가벼워진다.
   * ⚠ 판을 되살리려면 좌우 패딩을 0 으로 두거나 본문 정렬을 함께 다시 재라 — 둘은 한 쌍이다.
   */
  margin-top: clamp(${space[8]}, 4vw, ${space[12]});
  padding-top: clamp(${space[6]}, 3vw, ${space[10]});
  border-top: 1px solid ${color.border};

  /* 위 헤어라인이 경계를 말하므로 CommentSection 루트가 갖고 있는 자체 구분선은 접는다. */
  & > section {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
`;

/* ── 상태 (로딩 · 없음 · 오류) ───────────────────────────────────────────────
 * 🔴 가장 자주 방치되는 세 화면이다. 로딩은 "불러오는 중…" 한 줄이었는데, 그 한 줄이
 * 화면 전체를 대신하고 있어 앱이 비어 보였다. 이제 **들어올 글의 모양 그대로** 자리를 잡는다. */

const shimmer = keyframes`
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
`;

export const SkeletonShell = styled.div`
  display: grid;
  gap: ${space[5]};
  padding-top: ${space[4]};
`;

/**
 * 스켈레톤 한 조각. 중립 3색(border → surface → border)을 흐르게 해 "로딩 중"을 모션으로 말한다.
 * `prefers-reduced-motion` 에서는 흐름을 멈추고 면색만 남긴다(정보 손실 없음).
 *
 * 🔴 2026-08-03 흰 캔버스 전환에서 **두 stop 을 다시 골랐다.** 종전은 sunken → hover → sunken.
 *  - 블록 면(sunken 1.11:1)은 흰 지면 위에서 너무 얇았다. `border`(1.49:1)로 올렸다 —
 *    커뮤니티 목록 스켈레톤(`FeedStates.styled.ts`)과 같은 어휘다.
 *  - 가운데 stop 이 `surfaceHover` 였는데 velog 라이트에서 `surface-hover` 와 `surface-sunken`
 *    이 **같은 값**(#f1f3f5, 실측 대비 1.000)이 되어 **스윕이 통째로 사라졌다**(평평한 한 색 =
 *    멈춘 스켈레톤 = "로딩 중"이 아니라 "여기까지"로 읽힌다).
 */
export const SkeletonBar = styled.div<{ w: string; h: string }>`
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  max-width: 100%;
  border-radius: ${radius.sm};
  background: linear-gradient(
    90deg,
    ${color.border} 25%,
    ${color.surface} 37%,
    ${color.border} 63%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: ${color.border};
  }
`;

export const SkeletonLines = styled.div`
  display: grid;
  gap: ${space[3]};
  margin-top: ${space[4]};
`;

export const StateWrap = styled.div`
  max-width: 520px;
  margin: clamp(${space[8]}, 8vw, ${space[16]}) auto 0;
`;

export const BannerAction = styled.div`
  margin-top: ${space[3]};
`;

/** 복사 폴백 토스트 — 배경/글자색은 토큰(다크에서도 대비 안전). */
export const ShareToast = styled.div`
  position: fixed;
  top: ${space[4]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  max-width: min(92vw, 420px);
  background: ${color.text};
  color: ${color.surface};
  border-radius: ${radius.pill};
  padding: ${space[3]} ${space[5]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  box-shadow: ${shadow.e3};
  word-break: break-all;
`;
