import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  color,
  font,
  media,
  motion,
  pageHueMix,
  pressTransition,
  pressableSubtle,
  radius,
  scrollFadeRight,
  space,
  stickyCellTable,
  stickyColumn,
  subtleScrollbar
} from '@/shared/styles';

/* --------------------------------------------------------------------------
 * `/dividend/lists` 허브 — **랜딩형 지면**(2026-08-05 사용자 지시로 전면 개편)
 *
 * ## 무엇이 틀렸었나
 * 종전 허브는 "카드 3장 + 4열 비교표"였다. 세 카드는 제목·기준·한 줄 설명만 갖고 있어서
 * **셋의 차이를 그 화면에서 알 수 없었고**, 검색으로 처음 들어온 사람은 아무거나 눌러 보고
 * 뒤로 돌아왔다. 비교표는 정보를 다 갖고 있었지만 글자만 있어 아무도 읽지 않았다.
 *
 * ## 지금의 골격
 * ```
 *  [히어로]
 *  [개념 블록]  연속 증배가 무엇인가 — 목록 이름을 모르는 사람을 위한 자리
 *  [지그재그 3블록]  그림 좌/우 교차 · 제목 · 한 줄 성격 · 근거 3줄 · 종목 수 · 열기
 *  [관계 한 줄]
 *  [비교 매트릭스]  세 목록을 열로 세우고 질문을 행으로 — 그림 머리 + 마지막 행이 CTA
 *  [푸터]
 * ```
 *
 * ## 색면 예산
 * 🔴 이 페이지가 새로 만드는 **틴트 면은 개념 블록 하나**다(히어로는 PageHero 소유). 지그재그
 * 블록과 매트릭스는 전부 중립 면·경계·여백으로 위계를 만든다 — `tools/dev/tintscan.mjs` 가
 * 라우트당 2면을 넘기면 exit 1 이다.
 * -------------------------------------------------------------------------- */

const BLOCK_PAD = 'clamp(20px, 3vw, 36px)';

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(28px, 4vw, 56px);
  margin-top: ${space[6]};
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[4]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(${font.size.xl}, 2.4vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const SectionLede = styled.p`
  margin: 0;
  max-width: 62ch;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
`;

/* ── 개념 블록 ───────────────────────────────────────────────────────────── */

/**
 * "연속 증배가 무슨 뜻인가" — 이 페이지에서 **유일하게 면색을 갖는 블록**이다.
 *
 * 왜 여기냐: 이 지면에서 가장 먼저 읽혀야 하는 것이 목록 이름이 아니라 개념이고, 색면은 그
 * "여기부터 읽어라"를 글자 없이 말하는 유일한 수단이다. 나머지 블록은 전부 중립이라 이 한 장이
 * 눈에 들어온다.
 */
export const ConceptPanel = styled.section`
  display: grid;
  gap: ${space[3]};
  padding: ${BLOCK_PAD};
  border-radius: ${radius.xl};
  border: 1px solid ${pageHueMix(40, 'transparent')};
  background: ${pageHueMix(7)};
`;

export const ConceptTitle = styled.h2`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(${font.size.lg}, 2vw, ${font.size['2xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const ConceptBody = styled.p`
  margin: 0;
  max-width: 68ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;

  /* 문장 안의 **강조**는 굵기만 쓴다 — 색을 쓰면 이 옅은 틴트 면 위에서 대비 계약 밖으로 나간다. */
  strong {
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }
`;

/* ── 지그재그 소개 블록 ──────────────────────────────────────────────────── */

/**
 * 목록 하나를 소개하는 한 장면. **그림과 글이 좌우로 마주 본다.**
 *
 * 🔴 `$flip` 은 그림이 **오른쪽**에 서는 경우다(배당귀족). 세 블록이 좌·우·좌로 교차해야
 * 스크롤에 리듬이 생긴다 — 셋 다 같은 쪽이면 목록 세 개가 한 덩어리로 읽힌다.
 * ⚠ 좁은 폭에서는 **그림이 먼저, 글이 나중**으로 한 열이 된다. DOM 순서를 글→그림으로 두고
 *   넓은 폭에서만 `order` 로 뒤집는 방식은 쓰지 않는다 — 낭독 순서가 화면과 갈린다.
 */
export const Spotlight = styled.article<{ $flip: boolean }>`
  display: grid;
  align-items: center;
  /* 태블릿 이상에서 그림이 배경으로 물러나며 absolute 가 된다 — 그 기준 상자가 여기다. */
  position: relative;
  overflow: hidden;
  gap: clamp(16px, 3vw, 40px);
  padding: ${BLOCK_PAD};
  border-radius: ${radius.xl};
  border: 1px solid ${color.border};
  background: ${color.surface};

  /* 그림이 흐름 밖으로 나가면서 이 블록은 어느 폭에서도 **한 열**이다($flip 은 후광 쪽만 쓴다). */

  /*
   * 그림 뒤 후광 — 캐릭터의 보라가 흰 면에서 뚝 끊기지 않게 그림 쪽에만 아주 옅게 깐다
   * (목록 페이지 HeroBlock 이 같은 처방을 쓴다. 글자 쪽에는 번지지 않는다).
   */
  position: relative;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      90% 80% at ${({ $flip }) => ($flip ? '88%' : '12%')} 70%,
      ${pageHueMix(16)} 0%,
      ${pageHueMix(6)} 42%,
      transparent 66%
    );
  }
`;

/**
 * 목록 그림. 🔴 **제목 줄 오른쪽 끝에 작게 선다**(2026-08-07 사용자 지시).
 * 종전에는 자기 열을 갖는 clamp(180px, 24vw, 300px) 짜리였다 — 블록 하나가 화면 한 판을 쓰고,
 * 좁은 폭에서는 글보다 그림이 먼저 눈에 들어왔다. 이제 제목의 동반자 크기다.
 */
export const SpotlightArt = styled.img`
  /*
   * 🔴 **어느 폭에서도 같은 자리다**(2026-08-07 사용자 지시). 카드 오른쪽에 옅게 깔리는 배경
   * 이미지이고, 크기만 폭을 따라 줄었다 늘었다 한다.
   *
   * 종전에는 폭에 따라 역할이 갈렸다(모바일=제목 줄의 작은 동반자 / 태블릿 이상=배경). 그러면
   * 같은 카드가 폭마다 다른 화면으로 읽히고, 실제로 세 목록의 그림 정렬이 서로 어긋났다
   * (챔피언만 다른 자리에 섰다 — 그림마다 세로 비율이 달라 흐름 안에서는 윗변이 맞지 않는다).
   * 흐름 밖으로 빼고 세로 가운데에 고정하면 비율과 무관하게 세 카드가 같은 자리를 쓴다.
   *
   * ⚠ 흐름에서 빠지므로 부모(Spotlight)가 relative 여야 하고, 글(SpotlightBody)이 이 자리를
   *   침범하지 않게 오른쪽 여백을 비워 둔다.
   * ⚠ 장식이라 클릭을 통과시키고 낭독에서도 빠진다(alt="").
   */
  position: absolute;
  right: clamp(4px, 2vw, 32px);
  /*
   * 🔴 좁은 폭에서는 **우측 상단**이다(2026-08-07 사용자 지시). 그 폭에서는 카드가 세로로 길어져
   * 세로 가운데가 본문 한복판이 된다 — 그림이 글 뒤 가운데에 깔리면 가장 읽어야 할 문장 위에
   * 얹힌다. 위로 올리면 제목 줄 옆에 서서 "이 카드가 무엇인지"만 말하고 본문은 비워 준다.
   */
  top: ${space[3]};
  width: clamp(72px, 22vw, 260px);
  height: auto;
  /* 글 뒤로 물러난 만큼 옅게 — 진하면 그 위의 문장이 읽히지 않는다. */
  opacity: 0.45;
  z-index: 0;
  pointer-events: none;
  user-select: none;

  /* 넓은 폭에서는 카드가 낮고 넓어 세로 가운데가 맞다 — 그 자리가 오른쪽 여백의 한복판이다. */
  ${media.up('tablet')} {
    top: 50%;
    transform: translateY(-50%);
  }
`;

export const SpotlightBody = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  /* 배경으로 깔린 그림 **위**에 선다(그림은 z-index 0). 글이 장식에 묻히지 않는다. */
  position: relative;
  z-index: 1;

  /* 그림이 오른쪽에 깔리는 폭에서는 글이 그 자리를 침범하지 않게 오른쪽을 비워 둔다. */
  /*
   * 🔴 좁은 폭에서는 **자리를 비우지 않는다**(2026-08-07 사용자 지시: 텍스트 뒤에 표기되게).
   * 글이 카드 폭을 다 쓰고 그림은 그 **뒤로** 깔린다(그림 z-index 0 · 이 상자 1). 좁은 화면에서
   * 오른쪽을 100px 비우면 남는 글 폭이 두세 낱말이라, 비켜 주는 대가가 너무 크다.
   * 넓은 폭에서는 그림이 커져 글과 겹치면 읽기 어려우므로 그때만 자리를 비운다.
   */
  ${media.up('tablet')} {
    padding-right: clamp(140px, 20vw, 240px);
  }
`;

/**
 * 제목 한 줄 — 목록 이름 + 기준 칩 + 그림이 **같은 줄**에 선다(2026-08-07 사용자 지시).
 * 좁아지면 기준 칩이 먼저 줄어들며 말줄임으로 접힌다 — 목록 이름이 먼저 살아야 한다.
 */
export const SpotlightHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/** 기준을 한 조각으로 박는 칩. 폭이 짧아(<180px) 틴트 면으로 세어지지 않는다. */
export const SpotlightBadge = styled.span`
  justify-self: start;
  /*
   * 이름 다음으로 자리를 양보한다 — 좁아지면 여기부터 줄고, 넘치면 말줄임이 된다.
   * ⚠ inline-flex 가 아니라 **inline-block** 이다. 글자만 담는데 flex 상자면 익명 아이템이 생겨
   *   text-overflow 가 걸리지 않는다(말줄임이 조용히 안 먹는 흔한 자리다).
   */
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  padding: 4px ${space[3]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

export const SpotlightTitle = styled.h3`
  margin: 0;
  /* 이름은 줄지 않는다 — 세 글자짜리 고유명이라 여기가 접히면 무엇을 보는지 알 수 없게 된다.
     자리를 양보하는 쪽은 옆의 기준 칩이다(SpotlightBadge 의 flex: 0 1 auto). */
  flex: none;
  font-family: ${font.display};
  font-size: clamp(${font.size['2xl']}, 3.2vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const SpotlightHeadline = styled.p`
  margin: 0;
  font-size: clamp(${font.size.base}, 1.6vw, ${font.size.lg});
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${color.text};
  word-break: keep-all;
`;

/** 근거 세 줄. `ul` 인 것은 시맨틱이다 — 순서가 아니라 항목의 나열이다. */
export const SpotlightPoints = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const SpotlightPoint = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;

  /* 점은 장식이라 접근성 트리에 넣지 않는다(::before 는 애초에 안 읽힌다). */
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    margin-top: 0.55em;
    border-radius: ${radius.pill};
    background: ${color.brandBorder};
  }

  strong {
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }
`;

/** "이 목록이 답하는 질문" — 블록의 마지막 한 줄. 여는 버튼 바로 위에 선다. */
export const SpotlightQuestion = styled.p`
  margin: 0;
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

export const SpotlightFoot = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[3]};
`;

export const SpotlightMeta = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 목록을 여는 버튼.
 *
 * ⚠ 공용 `Button` 을 쓰지 않는 이유: 이 자리는 **링크**여야 한다(새 탭·주소 복사가 되어야 하고,
 * 크롤러가 세 목록으로 가는 내부 링크를 여기서 찾는다). 모양은 primary 버튼과 같은 대역으로 맞춘다.
 */
export const SpotlightCta = styled(Link)`
  ${pressableSubtle}
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[2]} ${space[5]};
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  /* ⚠ 누름 믹스인을 쓰면 자기 transition 목록에 pressTransition 을 **반드시** 끼워야 한다 —
     안 그러면 이 선언이 믹스인의 transition 을 덮어 눌림 피드백이 사라진다(shared 가드가 잡는다). */
  transition:
    filter ${motion.fast} ${motion.ease},
    ${pressTransition};

  &:hover,
  &:focus-visible {
    filter: brightness(0.94);
  }
`;

export const RelationNote = styled.p`
  margin: 0;
  max-width: 70ch;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

/* ── 비교 매트릭스 ───────────────────────────────────────────────────────── */

/**
 * 세 목록을 **열**로 세우고 질문을 **행**으로 놓는 비교표.
 *
 * 종전에는 목록이 행이고 속성이 열인 4열 표였다. 뒤집은 이유: 사용자가 하는 일은 "한 목록의
 * 속성 읽기"가 아니라 **"같은 질문에 대한 세 답 비교"** 다. 뒤집으면 눈이 가로로 한 줄만 훑으면 된다.
 *
 * ⚠ 좁은 폭에서는 가로 스크롤로 넘긴다 — 열을 세로로 접으면 비교라는 목적 자체가 사라진다.
 */
export const CompareWrap = styled.div`
  overflow-x: auto;
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.border};
  /* 생 overflow 만 두면 각진 네이티브 스크롤바가 나온다 — 앱 공통 믹스인으로 모양을 맞춘다. */
  ${subtleScrollbar}

  /* 가로 스크롤이 페이지로 번지지 않게 — 표 끝에서 손가락을 계속 밀면 뒤 페이지가 따라 움직인다. */
  overscroll-behavior-x: contain;
  background: ${color.surface};

  /* 끝 흐림은 앱 공통 처방이다 — 판단(폭·색 없음·왼쪽은 안 흐림)은 그 파일이 갖는다. */
  ${scrollFadeRight}
`;

export const CompareTable = styled.table`
  width: 100%;
  min-width: 620px;
  /* 🔴 첫 열을 고정하려면 이 표는 separate 여야 한다 — 이유는 stickyCellTable 주석. */
  ${stickyCellTable}
  text-align: left;

  /*
   * 🔴 마지막 줄의 밑줄을 지운다. 그 선은 상자 **폭 전체**를 가로지르므로,
   * 둥근 아래 모서리를 직선으로 잘라 "반경이 안 먹은" 모양이 된다(같은 사용자 신고).
   * 줄 사이를 가르는 것이 그 선의 일이고, 마지막 줄 아래에는 가를 것이 없다.
   */
  tbody tr:last-of-type > * {
    border-bottom: 0;
  }
`;

/** 열 머리 — 그림 + 목록 이름. 그림이 있어야 위 지그재그 블록과 같은 것임을 눈이 잇는다. */
export const CompareHeadCell = styled.th`
  padding: ${space[4]} ${space[3]};
  border-bottom: 1px solid ${color.borderStrong};
  vertical-align: bottom;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  /*
   * 첫 열 = 항목 이름 자리. 🔴 **머리 칸도 함께 고정된다** — 아래 값 줄만 붙어 있고 머리가
   * 밀려 나가면 고정된 열에 이름이 없는 상태가 된다(2026-08-07 사용자 지시).
   * ⚠ 아래 CompareRowLabel 과 **같은 left · 같은 배경 · 같은 경계선**을 써야 한 열로 보인다.
   */
  &:first-of-type {
    width: 22%;
    min-width: 132px;
    ${stickyColumn('0', true)}
    text-align: center;
  }
`;

export const CompareHeadInner = styled.span`
  display: grid;
  justify-items: center;
  gap: ${space[2]};
  text-align: center;
`;

export const CompareHeadArt = styled.img`
  width: clamp(56px, 7vw, 88px);
  height: auto;
  pointer-events: none;
  user-select: none;
`;

/**
 * 행 이름(첫 열).
 *
 * 🔴 **가로로 밀어도 제자리에 남는다**(2026-08-07 사용자 지시: 스크롤 시 fixed 로 따라오게).
 * 이 표는 좁은 폭에서 가로로 밀리는데, 그때 첫 열이 함께 밀려 나가면 "지금 보는 값이 무슨
 * 항목이었는지"를 잃는다 — 값만 셋 남고 질문이 사라진다.
 * ⚠ 배경이 반드시 있어야 한다(고정 칸은 다른 칸 위를 지나간다). 경계선은 border 가 아니라
 *   box-shadow 로 그린다 — border-collapse 표에서는 테두리의 주인이 표라 함께 밀려간다.
 */
export const CompareRowLabel = styled.th`
  /* 🔴 값 열들이 가운데 정렬이라 항목 열도 같은 축에 선다(2026-08-07 사용자 지시). */
  text-align: center;
  ${stickyColumn('0', true)}
  padding: ${space[3]};
  border-bottom: 1px solid ${color.border};
  vertical-align: middle;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
`;

export const CompareCell = styled.td`
  padding: ${space[3]};
  border-bottom: 1px solid ${color.border};
  vertical-align: middle;
  text-align: center;
  color: ${color.text};
  font-size: ${font.size.sm};

  /* 마지막 줄(열기 버튼)은 경계 없이 끝난다. */
  tr:last-of-type & {
    border-bottom: 0;
  }
`;

/** 숫자 칸 — 종목 수처럼 크기 비교가 의미 있는 값만 이 서체를 쓴다. */
export const CompareNumber = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  ${font.numeric}
`;

export const CompareLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: ${space[1]} ${space[4]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.brandBorder};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: ${color.brandSubtle};
  }
`;
