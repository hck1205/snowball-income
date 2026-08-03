import styled from '@emotion/styled';
import { color, font, motion, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * ── 본문 프로즈 (2026-08-03 타이포 리워크) ──────────────────────────────────
 *
 * sanitize 허용 태그(p/br/h2/h3/ul/ol/li/a/strong/b/em/i/s/u/blockquote/code/pre/hr/
 * table/tbody/tr/th/td)만 다룬다. 허용 목록(`shared/lib/richtext/sanitize.ts`)에 태그를 추가하면
 * 여기 렌더 스타일도 함께 채워야 한다 — 안 그러면 브라우저 기본 스타일로 떨어져 본문 톤이 깨진다.
 *
 * ## 무엇을 바꿨나 (전부 "크기·간격·형태" — 새 색 토큰 0개)
 *
 * | | 전 | 후 | 왜 |
 * |---|---|---|---|
 * | 본문 | 15px / 1.6 | **16px / 1.75** | 15px·1.6 은 폼 컨트롤의 치수다. 읽는 지면은 행간이 더 필요하다 |
 * | 첫 문단 | 본문과 동일 | **18px 리드** | 글의 도입부가 본문과 같은 무게라 들어가는 입구가 없었다 |
 * | h2 | 18px, 여백만 | **20~30px + 앞 컬러 막대** | 본문(16)과 2px 차이면 제목이 아니다. 막대는 L1(28x4px) |
 * | h3 | 16px | **20px** | h2 와 본문 사이의 실제 중간 단계 |
 * | 인용 | 좌측 3px 브랜드 바 + 회색 글자 | **풀 인용 — 18px 본문색 + 중립 2px 바** | 회색으로 죽여 두면 "인용은 덜 중요한 말"이 된다 |
 * | 표 | 셀마다 사방 테두리 + 헤더 면색 | **가로 괘선만 + 헤더 라벨 + 행 호버** | 격자 테두리는 숫자를 가둔다. 금융 표의 관례는 가로선이다 |
 * | 구분선 | 1px 전폭 실선 | **가운데 점 세 개** | 전폭 실선은 h2 의 구획과 신호가 겹쳤다 |
 * | 링크 | 항상 밑줄 | **밑줄이 hover 에 두꺼워짐** | 형태(밑줄)는 유지하되 상호작용을 모션으로 말한다 |
 *
 * 🔴 표 헤더의 강조는 **면색을 뺐어도** 색 단독 채널이 아니다 — 굵기(semibold) + 2px 괘선 +
 * 작은 라벨 크기 세 가지가 함께 말한다(회색조에서도 헤더가 헤더로 읽힌다).
 */

/** 산문의 글줄 길이 상한. `ch` 라 폰트 크기가 바뀌어도 "글자 수" 기준이 유지된다. */
const MEASURE = '72ch';

export const Prose = styled.article`
  color: ${color.text};
  font-size: ${font.size.lg};
  line-height: 1.75;
  word-break: break-word;
  overflow-wrap: anywhere;
  /*
   * 🔴 본문이 페이지 폭을 넓히지 못하게 하는 마개.
   * 아래 table 이 GitHub 레시피(display:block + width:max-content + max-width:100%)를 쓰는데,
   * 퍼센트 max-width 는 내재 크기(min/max-content) 계산에서 무시된다 — 그래서 이 요소의 min-content
   * 기여가 표의 max-content 가 되고, 조상 grid 의 auto 트랙이 그 값으로 부풀어 문서 전체가
   * 뷰포트보다 넓어진다(390px 뷰포트에서 문서 592px 실측 → sticky 헤더가 가로 스크롤에 잘렸다).
   * 여기서 0 으로 끊으면 표는 설계대로 자기 안에서만 스크롤한다.
   */
  min-width: 0;

  /*
   * 🔴 글줄 길이 상한은 **읽는 것들에만** 건다. 표·코드블록은 넓은 폭을 그대로 쓰는 게 이득이고,
   * 좁히면 표가 불필요하게 스크롤된다. 즉 "지면은 넓게, 읽는 줄만 짧게"다.
   */
  p,
  ul,
  ol,
  h2,
  h3,
  blockquote {
    max-width: ${MEASURE};
  }

  p {
    margin: 0 0 ${space[5]};
  }

  /* 리드 문단 — 글의 입구. 본문보다 한 단 크고 행간이 조금 좁다(덩어리로 읽히게). */
  & > p:first-of-type {
    font-size: ${font.size.xl};
    line-height: 1.65;
    color: ${color.text};
  }

  /*
   * 🔴 절 간격은 **위 형제가 있을 때만** 준다(인접 형제 결합자). 위쪽 마진을 무조건 주고
   * first-child 로 되돌리는 방식이 흔하지만, Emotion 이 그 의사클래스를 SSR 위험으로 경고하고
   * (api/share-html.js 가 이 프로즈를 서버에서 그린다) 첫 요소가 무엇이냐에 따라 규칙이 갈린다.
   * 형제 결합자는 "앞에 뭔가 있으면 띄운다"를 그대로 표현해 첫 요소 예외가 아예 필요 없다.
   */
  /*
   * 하한이 2xl(20px)이 아니라 3xl(24px)인 이유: h3 가 20px 이라 모바일(2.6vw≈10px → 하한 채택)에서
   * 둘이 **같은 크기**가 됐다. 실측으로 잡은 값이다 — 390px 에서 h2 24 / h3 20 / 본문 16 의
   * 4px 계단이 유지된다.
   */
  h2 {
    margin: 0 0 ${space[4]};
    font-size: clamp(${font.size['3xl']}, 2.6vw, ${font.size['4xl']});
    font-weight: ${font.weight.bold};
    line-height: ${font.leading.tight};
    letter-spacing: -0.02em;
  }

  /*
   * 절 머리의 표식. 28x4px 이라 tintscan 의 면 하한(폭 180 / 높이 8) 어느 쪽에도 닿지 않는다 —
   * 선(L1)이다. 색만으로 말하지 않는다: 이 막대가 없어도 크기·굵기·여백이 이미 h2 를 h2 로 만든다.
   */
  h2::before {
    content: '';
    display: block;
    width: 28px;
    height: 4px;
    margin-bottom: ${space[3]};
    border-radius: ${radius.pill};
    background: ${color.brand};
  }

  /*
   * h3 는 크기(20px)만으로는 **굵은 본문 한 줄**과 헷갈린다(16px bold 와 4px 차이). 그래서
   * 절 아래 hairline 을 하나 긋는다 — h2 의 표식(위쪽 컬러 막대)·인용(왼쪽 바)과 자리가 갈려
   * 세 요소가 서로를 흉내 내지 않는다. 회색조에서도 남는 형태 채널이다.
   */
  h3 {
    margin: 0 0 ${space[4]};
    padding-bottom: ${space[2]};
    border-bottom: 1px solid ${color.border};
    font-size: ${font.size['2xl']};
    font-weight: ${font.weight.bold};
    line-height: ${font.leading.snug};
    letter-spacing: -0.01em;
  }

  ul,
  ol {
    margin: 0 0 ${space[5]};
    padding-left: ${space[6]};
  }

  li {
    margin: ${space[2]} 0;
    padding-left: ${space[1]};
  }

  /* 글머리 기호·번호는 본문보다 약하게(내용이 주인공), 번호만 tabular 로 자릿수를 세운다. */
  ul li::marker {
    color: ${color.textMuted};
  }

  ol li::marker {
    color: ${color.textSecondary};
    font-weight: ${font.weight.semibold};
    font-variant-numeric: tabular-nums;
  }

  /*
   * 링크. 밑줄을 배경 그라디언트로 그려 두께를 애니메이션한다(text-decoration 은 전환이 안 된다).
   * 색과 밑줄 두 채널이 항상 함께 있으므로 회색조에서도 링크가 링크로 읽힌다.
   */
  a {
    color: ${color.brandText};
    text-decoration: none;
    background-image: linear-gradient(${color.brandBorder}, ${color.brandBorder});
    background-repeat: no-repeat;
    background-position: 0 100%;
    background-size: 100% 1px;
    padding-bottom: 1px;
    transition: background-size ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

    &:hover {
      color: ${color.brand};
      background-image: linear-gradient(${color.brand}, ${color.brand});
      background-size: 100% 2px;
    }
  }

  strong,
  b {
    font-weight: ${font.weight.bold};
  }

  u {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  s {
    text-decoration: line-through;
    color: ${color.textMuted};
  }

  /*
   * 구분선 — 가운데 점 셋. 전폭 실선은 h2 의 구획 신호와 겹쳐서 "절이 두 번 바뀐 것"처럼 보였다.
   * 48px 폭에 16px 간격 점이므로 정확히 3개가 그려진다.
   */
  hr {
    width: 48px;
    height: 4px;
    margin: 0 auto ${space[12]};
    border: 0;
    color: ${color.textMuted};
    background-image: radial-gradient(circle, currentColor 1.5px, transparent 1.6px);
    background-size: 16px 4px;
    background-repeat: repeat-x;
  }

  /*
   * 인용 = 풀 인용. 회색으로 죽이지 않는다 — 글쓴이가 일부러 끌어온 말이라 본문보다 **크다**.
   * 좌측 바는 중립 2px(브랜드색을 빼서 링크·h2 막대와 신호가 겹치지 않게 했다).
   */
  blockquote {
    margin: 0 0 ${space[6]};
    padding: ${space[1]} 0 ${space[1]} ${space[6]};
    border-left: 2px solid ${color.borderStrong};
    color: ${color.text};
    font-size: ${font.size.xl};
    line-height: ${font.leading.relaxed};
    font-weight: ${font.weight.medium};

    p {
      font-size: inherit;
      line-height: inherit;
      max-width: none;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.88em;
    background: ${color.surfaceSunken};
    border: 1px solid ${color.border};
    padding: 1px ${space[1]};
    border-radius: ${radius.xs};
  }

  pre {
    margin: 0 0 ${space[5]};
    padding: ${space[5]};
    background: ${color.surfaceSunken};
    border: 1px solid ${color.border};
    border-radius: ${radius.lg};
    overflow-x: auto;
    font-size: ${font.size.base};
    line-height: ${font.leading.relaxed};
    ${subtleScrollbar}

    code {
      background: none;
      border: 0;
      padding: 0;
      font-size: inherit;
    }
  }

  /*
   * 표. 좁은 화면에서 표만 가로 스크롤되게 한다.
   *
   * ⚠ 저장 HTML 은 editor.getHTML() 산출물이라 에디터 DOM 에 있던 .tableWrapper div 가 **없다**
   * (실측 확인). Prose 는 styled.article 하나뿐이라 스타일만으로 래퍼를 만들 수도 없다.
   * 그래서 GitHub 마크다운과 같은 레시피로 **표 자신을 블록으로 만들어** 스크롤 컨테이너로 쓴다.
   */
  table {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    ${subtleScrollbar}
    border-collapse: collapse;
    margin: 0 0 ${space[5]};
    font-size: ${font.size.base};
    line-height: ${font.leading.normal};
    ${font.numeric};
  }

  /* 사방 격자를 걷어내고 **가로 괘선만** 남긴다 — 이 앱의 데이터 표와 같은 어휘다. */
  th,
  td {
    border: 0;
    border-bottom: 1px solid ${color.border};
    padding: ${space[3]} ${space[4]};
    text-align: left;
    vertical-align: top;

    /* Tiptap 이 셀 내용을 p 로 감싼다 — 문단 기본 여백이 셀 안에서 겹치지 않게 지운다. */
    & > p {
      margin: 0;
      max-width: none;
    }
  }

  /* 헤더는 면색이 아니라 **작은 라벨 + 굵기 + 2px 괘선** 세 채널로 선다. */
  th {
    border-bottom: 2px solid ${color.borderStrong};
    color: ${color.textSecondary};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.semibold};
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  tbody tr {
    transition: background ${motion.fast} ${motion.ease};

    &:hover {
      background: ${color.surfaceHover};
    }

    &:last-of-type td {
      border-bottom: 0;
    }
  }

  /*
   * 절이 바뀔 때의 숨. 앞에 형제가 있을 때만 걸리므로 글의 첫 요소는 자동으로 붙어 시작한다.
   * h2 가 가장 크게 쉬고(48px), h3·인용·코드·표가 그다음(32px)이다.
   */
  * + h2,
  * + hr {
    margin-top: ${space[12]};
  }

  * + h3,
  * + blockquote,
  * + pre,
  * + table {
    margin-top: ${space[8]};
  }

  & > *:last-child {
    margin-bottom: 0;
  }
`;
