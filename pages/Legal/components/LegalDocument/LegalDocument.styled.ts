import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  appHeaderHeight,
  color,
  font,
  media,
  motion,
  radius,
  space,
  zIndex
} from '@/shared/styles';

/**
 * 법무 고지문의 **판형**.
 *
 * 이전 판형은 "폭 860px 짜리 한 줄에 카드를 열네 장 쌓기"였다. 그 결과가 이랬다.
 *  - 어디까지 왔는지 알 수 없다(스크롤바 말고는 단서가 없다).
 *  - 원하는 조항으로 갈 방법이 없다 — Ctrl+F 뿐이다.
 *  - 제목 14px / 본문 13px 이라 위계가 없고, 카드 열네 장이 전부 같은 무게로 보인다.
 *
 * 지금은 **문서 판형**이다: 왼쪽 목차 레일 + 오른쪽 본문, 그리고 화면 상단의 읽기 진행 띠.
 * 이 앱에서 왼쪽 레일을 쓰는 화면은 여기뿐인데, 그래도 되는 이유는 이 화면만이 **선형으로 긴 글**
 * 이기 때문이다(다른 화면은 값을 고치고 결과를 보는 곳이라 레일이 자리만 먹는다).
 *
 * 🔴 히어로는 공용 `PageHero` 그대로다. "앱의 히어로는 한 벌"이 확정 결정이라 여기서 복제하지 않고,
 *    판형·목차·조항 형태를 바꾸는 것으로 화면을 다시 세웠다.
 */

/** 왼쪽 레일 폭. 조항 제목이 두 줄 안에 들어가는 최소치(가장 긴 제목: "처리하는 개인정보의 항목과 수집 방법"). */
const TOC_RAIL_WIDTH = '236px';

export const PageRoot = styled.div`
  display: grid;
  gap: clamp(20px, 3vw, 32px);
  min-width: 0;
`;

/**
 * 읽기 진행 띠. 헤더 바로 아래에 붙는다.
 *
 * 높이 3px 은 **선이지 면이 아니다** — 이 앱의 색 면 예산(화면당 2개)은 높이 8px 이상만 센다.
 * 순수 장식이라 `aria-hidden` 이고, 같은 정보를 목차의 활성 표시가 의미 있는 형태로 다시 말한다.
 */
export const ReadingProgress = styled.div`
  position: fixed;
  top: ${appHeaderHeight};
  left: 0;
  right: 0;
  height: 3px;
  /* 헤더(headerSurface)보다 낮게 둬서 헤더 팝오버가 이 띠 위로 열린다. */
  z-index: ${zIndex.stickyAction};
  pointer-events: none;
  background: transparent;
`;

export const ReadingProgressFill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: 100%;
  transform-origin: 0 50%;
  transform: scaleX(${({ $ratio }) => $ratio});
  background: ${color.gradientCta};
  transition: transform ${motion.fast} ${motion.ease};
`;

/**
 * 히어로 + 목차 + 본문의 배치.
 *
 * 1024px 미만에서는 한 줄로 쌓이고(목차는 가로 칩 줄이 된다), 그 위에서는 두 열이 된다.
 * 경계를 `headerStack`(1024)에 맞춘 이유 — 그 폭에서 앱 헤더가 한 줄이 되므로 sticky 레일이
 * 붙을 자리가 안정된다.
 */
export const DocumentLayout = styled.div`
  display: grid;
  gap: clamp(20px, 3vw, 40px);
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;

  ${media.up('headerStack')} {
    grid-template-columns: ${TOC_RAIL_WIDTH} minmax(0, 1fr);
    align-items: start;
    column-gap: clamp(32px, 4vw, 56px);
  }
`;

/** 히어로는 두 열을 가로지른다 — 레일 옆에 세우면 제목이 절반 폭으로 접힌다. */
export const Masthead = styled.div`
  min-width: 0;

  ${media.up('headerStack')} {
    grid-column: 1 / -1;
  }
`;

/**
 * 본문 기둥.
 *
 * 조문은 한 줄이 길어질수록 읽는 사람이 줄을 놓친다. 그런데 폭 제한을 **문단마다** 걸었기 때문에
 * (`LegalClause.styled.ts` 의 PROSE_WIDTH) 여기서는 표가 쓸 수 있는 최대 폭까지 열어 둔다 —
 * 국외 이전 표는 열이 일곱이라 좁힐수록 가로 스크롤만 길어진다.
 */
export const Article = styled.div`
  display: grid;
  gap: clamp(28px, 4vw, 48px);
  min-width: 0;
  max-width: 880px;
`;

export const Clauses = styled.div`
  display: grid;
  gap: clamp(32px, 5vw, 56px);
  min-width: 0;
`;

/**
 * 시행일 등 문서 메타 줄. 히어로의 meta 슬롯에 그대로 들어가므로 **구문 콘텐츠만** 쓴다
 * (목록·블록을 넣으면 브라우저 파서가 문단을 끊는다 — PageHero.styled.ts HeroMeta 주석 참고).
 */
export const MetaList = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[3]};
`;

/**
 * 메타 한 항목. 🔴 텍스트 노드로 두면 안 된다 — flexbox 는 연속된 텍스트 런을 **하나의 익명
 * flex 아이템**으로 묶으므로 위 gap 이 적용될 경계 자체가 없다. 항목이 하나뿐인 지금은 증상이
 * 없고, 시행일이 확정되어 두 줄이 되는 순간 두 줄이 붙어 나온다(타입도 라우트 테스트도 잡지 못한다).
 * 가드: test/legal/legalDocumentMeta.test.tsx.
 */
export const MetaItem = styled.span`
  overflow-wrap: anywhere;
`;

/** 히어로 액션 슬롯에 들어가는 형제 문서 링크. 두 문서를 오가는 가장 짧은 길이다. */
export const HeroCrossLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[2]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  text-decoration: none;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  white-space: nowrap;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.borderStrong};
  }
`;
