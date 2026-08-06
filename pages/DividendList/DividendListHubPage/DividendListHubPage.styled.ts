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
  space,
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
  gap: clamp(16px, 3vw, 40px);
  padding: ${BLOCK_PAD};
  border-radius: ${radius.xl};
  border: 1px solid ${color.border};
  background: ${color.surface};

  ${media.up('tablet')} {
    grid-template-columns: ${({ $flip }) => ($flip ? 'minmax(0, 1fr) auto' : 'auto minmax(0, 1fr)')};
  }

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

export const SpotlightArt = styled.img`
  display: block;
  justify-self: center;
  width: clamp(180px, 24vw, 300px);
  height: auto;
  /* 장식이라 클릭을 통과시킨다 — 옆의 제목·버튼이 이 장면의 조작부다. */
  pointer-events: none;
  user-select: none;
`;

export const SpotlightBody = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/** 기준을 한 조각으로 박는 칩. 폭이 짧아(<180px) 틴트 면으로 세어지지 않는다. */
export const SpotlightBadge = styled.span`
  justify-self: start;
  display: inline-flex;
  align-items: center;
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
  background: ${color.surface};
  /* 생 overflow 만 두면 각진 네이티브 스크롤바가 나온다 — 앱 공통 믹스인으로 모양을 맞춘다. */
  ${subtleScrollbar}
`;

export const CompareTable = styled.table`
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  text-align: left;
`;

/** 열 머리 — 그림 + 목록 이름. 그림이 있어야 위 지그재그 블록과 같은 것임을 눈이 잇는다. */
export const CompareHeadCell = styled.th`
  padding: ${space[4]} ${space[3]};
  border-bottom: 1px solid ${color.borderStrong};
  vertical-align: bottom;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  /* 첫 열은 질문 이름 자리라 비어 있다. */
  &:first-of-type {
    width: 22%;
    min-width: 132px;
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

export const CompareRowLabel = styled.th`
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
