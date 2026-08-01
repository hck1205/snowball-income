import styled from '@emotion/styled';
import { cardElevation, color, font, media, radius, space } from '@/shared/styles';

/**
 * `/ledger` 의 로컬 스타일.
 *
 * 위계 규칙(§3.3): **이 화면의 주역 카드는 월 요약 하나**(`cardElevation('raised')`)이고,
 * `connected` 상태에서만 존재한다. 나머지 면은 공용 `Card`(base/sunken/wash)가 그린다.
 * 🔴 `Card` 안에 `Card` 를 넣지 않는다 — 저장 실패 목록은 요약 카드 밖 형제다.
 *
 * 색 규율(§3.4): 금액 숫자는 전부 `color.text` 중립이다. 손익색(`dataPositive`/`dataNegative`)을
 * 이 화면에서 쓰지 않는다 — 수입·지출은 P&L 이 아니다. 구분은 아이콘 + 텍스트 칩이 말한다.
 */

export const PageStack = styled.div`
  display: grid;
  /* 🔴 minmax(0, 1fr) — 기본 auto 트랙은 최소 크기가 min-content 라 긴 분류·메모가 문서를 넓힌다. */
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/**
 * 라이브 리전은 **처음부터 끝까지 마운트 상태를 유지**한다. 시각적으로만 숨기고 텍스트만 바꾼다 —
 * 조건부 언마운트는 접근성 트리에서 노드를 지워 이후 변경이 낭독되지 않는다.
 */
export const LiveRegion = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

/*
 * §4.1 연결 전 선택 타일(`ConnectSection`/`ConnectHeading`/`ConnectGrid`/`ChoiceBody`),
 * §4.2 매핑 그리드·미리보기, §4.5 폼, §4.6 삭제 대상 목록의 스타일은 **각 컴포넌트 폴더**가 갖는다.
 * 여기 두면 `pages/Ledger/components/*` 가 이 파일을 직접 import 해야 하는데, 그건 폴더 단위
 * import 규칙(`.cursor/rules`) 위반이다.
 */

/* ── §4.3 월 요약(주역 카드) ─────────────────────────────────────────────────── */

/**
 * 🔴 이 화면의 **주역 카드 하나**. 규칙대로 **제목이 없고**, 대신 월 제목(`aria-labelledby`)이
 * 이름 역할을 한다 — hero 숫자(순액)가 시각적 제목이다.
 */
export const SummaryCard = styled.section`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[5]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  border-radius: ${radius.xl};
  ${cardElevation('raised')}
`;

export const HeroSlot = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  display: grid;
`;

export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[3]};
`;

/** 값이 오기 전 자리. 로딩임을 형태로 말한다(숫자를 지어내지 않는다). */
export const SkeletonBar = styled.span`
  display: inline-block;
  width: 96px;
  height: 1em;
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
`;

/**
 * 목록 자리의 로딩 골격. 🔴 셔머 애니메이션을 새로 만들지 않는다 — 모양이 정적 단서다
 * (`components/MainContentLoader` 가 세운 규칙, reduced-motion 에서 셔머 없음).
 */
export const SkeletonList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const SkeletonRow = styled.span`
  display: block;
  height: 44px;
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

/* ── §4.4 이 달 기록 없음 ────────────────────────────────────────────────────── */

/**
 * 🔴 틴트는 **`accent*` 다(`accentAlt*` 가 아니다)**. `contrast.test.ts` 가 검증하는 조합이
 * `['text-secondary','accent-subtle']` 이기 때문이고, 페이지 hue(accentAlt)는 히어로가 이미
 * `--sb-page-hue` 로 표현한다 — 빈 상태 면까지 hue 로 칠할 이유가 없다.
 */
export const EmptyBlock = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 28px);
  border: 1px dashed ${color.accentBorder};
  border-radius: ${radius.xl};
  background: ${color.accentSubtle};
`;

export const EmptyTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 52ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/* ── 공통 액션 ──────────────────────────────────────────────────────────────── */

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * 🔴 무음 비활성 금지 — 비활성 버튼은 **언제나** 이 한 줄을 `aria-describedby` 로 가리킨다.
 * 화면에 이 줄은 **하나**다(버튼 수만큼 그리면 스크린리더가 같은 말을 열 번 읽는다).
 */
export const ActionHint = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/** 배너 본문 안에 버튼을 같은 줄로 세운다. ≤640 에서는 본문 아래로 내려간다(`flex-wrap`). */
export const BannerRow = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[3]};
`;

/* ── §4.11 생성 직후 ────────────────────────────────────────────────────────── */

export const CreatedActions = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[3]};
  margin-top: ${space[2]};
  min-width: 0;
`;

/** 🔴 시트 이름 자체가 링크다 — 주소를 복사·북마크할 수 있어야 "내 드라이브에 있다"가 증명된다. */
export const SheetLink = styled.a`
  min-width: 0;
  color: ${color.brandText};
  font-size: ${font.size.sm};
  text-decoration: underline;
  overflow-wrap: anywhere;
`;
