import styled from '@emotion/styled';
import { appHeaderHeight, cardElevation, color, font, media, radius, space } from '@/shared/styles';

/**
 * `/ledger` 의 로컬 스타일.
 *
 * ## 이 화면의 레이아웃 (2026-08-03 재설계)
 * 예전에는 히어로 아래로 **전폭 카드 일곱 장이 세로로 쌓였다** — 탭 줄 · 월 네비 · 요약 · 배당 ·
 * 목록 · 실패 목록. 전부 같은 폭·같은 무게라 "지금 무엇을 보고 있는가(범위)"와 "무엇이 적혀 있는가
 * (내역)"가 시각적으로 구분되지 않았고, 1280px 에서는 표 오른쪽이 통째로 비어 있었다.
 *
 * 그래서 **콘솔 2단**으로 다시 짰다.
 * ```
 *  ≥1024px                                   ≤1023px
 *  ┌ 범위 레일 ─┐ ┌ 내역 ─────────────┐      전부 1열 — 범위 → 요약 → 배당 → 내역
 *  │ 장부·기간  │ │ 거래 내역 표       │      (좁은 폭에서 2단은 표를 못 읽게 한다)
 *  │ 월 요약    │ │ 저장 실패 대기열   │
 *  │ 배당 겹침  │ └────────────────────┘
 *  └ sticky ────┘
 * ```
 * 왼쪽은 **읽는 맥락**(어느 장부·어느 달·그 달의 숫자)이라 스크롤을 따라 남고, 오른쪽은 **내용**이라
 * 길이가 자유롭다. 표가 길어질수록 이 구분이 커진다 — 300행짜리 시트에서 예전 레이아웃은 요약이
 * 화면 밖으로 사라졌다.
 *
 * ## 위계 규칙(§3.3)
 * **이 화면의 주역 카드는 월 요약 하나**(`cardElevation('raised')`)이고 `connected` 에서만 존재한다.
 * 🔴 `Card` 안에 `Card` 를 넣지 않는다 — 저장 실패 목록은 요약 카드 밖 형제다.
 *
 * ## 색 규율(§3.4)
 * 금액 숫자는 전부 `color.text` 중립이다. 손익색(`dataPositive`/`dataNegative`)을 이 화면에서 쓰지
 * 않는다 — 수입·지출은 P&L 이 아니다. 구분은 아이콘 + 텍스트 칩이 말한다.
 * 🔴 연결 후 화면의 **틴트 면은 푸터 브랜드 패널 하나**다(2026-08-03 tintscan 실측 1/2).
 * 히어로가 파스텔 램프에서 흰 면이 되면서 예산 한 장이 풀렸지만 **여기서 쓰지 않는다** — 가계부는
 * 숫자를 읽는 화면이고, 색 면이 늘면 그 숫자가 뒤로 물러난다. 이 파일이 깔던 빈 상태 액센트 면은
 * 중립(`surfaceSunken` + 파선)으로 내렸다 — 색은 "고르는 면"(미연결 무대)이 갖는다.
 *
 * ## 흰 캔버스에서의 면 (2026-08-03)
 * 라이트 배경이 순백이 되면서 `surface-muted`(흰 면 위 1.05:1)는 **자리표시자로 못 쓴다** —
 * 이 파일의 스켈레톤 3종을 `surface-sunken`(1.11:1)으로 올린 이유다. 그 근거는 `SkeletonBar` 주석.
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

/* ── 경보 레인 ───────────────────────────────────────────────────────────────── */

/**
 * 배너와 그 사유 줄이 사는 띠.
 *
 * 예전에는 배너 여섯 종이 `PageStack` 의 직계 자식이라 **본문 카드와 같은 간격**(최대 28px)으로
 * 흩어졌다. 만료 + 충돌 + 부분 실패가 동시에 뜨면 화면 절반이 배너였고, 그 사이사이가 벌어져
 * "이건 한 덩어리의 알림"으로 읽히지 않았다. 여기서는 8px 로 묶어 **하나의 경보 블록**으로 만든다.
 *
 * ⚠ 비어 있으면 호출부가 아예 렌더하지 않는다 — 빈 그리드가 남으면 `PageStack` 의 간격이 두 번 붙는다.
 */
export const AlertLane = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
  min-width: 0;
`;

/* ── 콘솔 2단 ────────────────────────────────────────────────────────────────── */

/**
 * 연결 후의 작업 공간. 🔴 1023px 이하는 **무조건 1열**이다 — 좁은 폭에서 표를 2단에 넣으면
 * 금액 열이 먼저 잘린다(이 레포가 표를 카드로 접는 경계와 같은 이유).
 */
export const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(16px, 2vw, 24px);
  align-items: start;
  min-width: 0;

  ${media.up('headerStack')} {
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  }
`;

/**
 * 왼쪽 "범위" 레일.
 *
 * `position: sticky` 의 기준은 **실측 헤더 높이**다(`appHeaderHeight`) — 88px 같은 상수를 적으면
 * 헤더가 한 줄에서 두 줄로 바뀔 때 레일이 헤더 뒤로 숨는다(이 레포에서 세 번 고쳐 쓴 값이다).
 * ⚠ `sticky` 는 2단일 때만 켠다. 1열에서는 레일이 화면 위에 붙어 본문을 가린다.
 */
export const ScopeRail = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(12px, 1.6vw, 16px);
  min-width: 0;

  ${media.up('headerStack')} {
    position: sticky;
    top: calc(${appHeaderHeight} + ${space[3]});
  }
`;

export const LedgerColumn = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(12px, 1.6vw, 16px);
  min-width: 0;
`;

/* ── 범위 패널(어느 장부 · 어느 기간) ─────────────────────────────────────────── */

/**
 * 탭 줄과 월 네비를 한 틀에 세운다.
 *
 * 🔴 **두 축을 한 컨트롤로 합치지 않는다.** 탭은 "어느 장부", 월은 "어느 기간"이라 축이 다르고,
 * 하나로 합치면 "탭을 넘기면 달도 넘어가나"라는 오해가 생긴다(각 컴포넌트 주석 참고). 여기서
 * 공유하는 것은 **틀 하나**뿐이고 두 컨트롤의 생김새는 여전히 다르다 — 위는 왼쪽 정렬 라벨 줄,
 * 아래는 가운데 정렬 월 제목이다.
 */
export const ScopePanel = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[3]};
  min-width: 0;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

/* ── §4.3 월 요약(주역 카드) ─────────────────────────────────────────────────── */

/**
 * 🔴 이 화면의 **주역 카드 하나**. 규칙대로 **제목이 없고**, 대신 월 제목(`aria-labelledby`)이
 * 이름 역할을 한다 — hero 숫자(순액)가 시각적 제목이다.
 *
 * 예전에는 hero `StatTile` 하나 + 2열 타일 격자였다. 세 숫자가 같은 부품·같은 리듬으로 서서
 * "순액이 결론이고 수입·지출은 그 내역"이라는 관계가 보이지 않았다. 지금은 **결론(큰 숫자) →
 * 가로선 → 내역 두 칸**의 3단이고, 두 칸은 세로 구분선으로 갈린다.
 */
export const SummaryCard = styled.section`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
  align-content: start;
  padding: clamp(18px, 2.4vw, 26px);
  border-radius: ${radius.xl};
  ${cardElevation('raised')}
`;

export const SummaryLabel = styled.p`
  margin: 0 0 ${space[1]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.04em;
  color: ${color.textMuted};
`;

/**
 * 순액. 🔴 **부호는 값이 갖고 색은 갖지 않는다**(수입·지출은 포지션이 아니다).
 * 자릿수가 흔들리지 않게 데이터 서체 + tabular 를 함께 건다.
 */
export const SummaryValue = styled.p`
  margin: 0;
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['3xl']}, 4.4vw, ${font.size['5xl']});
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.text};
  overflow-wrap: anywhere;
  ${font.numeric}
`;

export const SummaryHint = styled.p`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/** 수입·지출 두 칸. 세로선은 `gap` 이 아니라 테두리라 좁은 폭에서 가로선으로 눕는다. */
export const FlowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid ${color.border};

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const FlowCell = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
  padding: ${space[3]} 0 0;

  & + & {
    padding-left: ${space[4]};
    border-left: 1px solid ${color.border};
  }

  ${media.down('mobile')} {
    & + & {
      padding-left: 0;
      border-left: 0;
      border-top: 1px solid ${color.border};
    }
  }
`;

/** 라벨 줄: 방향 글리프 + 이름 + 건수. 🔴 방향은 글리프와 글자가 함께 말한다(색 아님). */
export const FlowHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};

  svg {
    flex: 0 0 auto;
  }
`;

export const FlowCount = styled.span`
  margin-left: auto;
  flex: 0 0 auto;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  ${font.numeric}
`;

export const FlowValue = styled.p`
  margin: 0;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  color: ${color.text};
  overflow-wrap: anywhere;
  ${font.numeric}
`;

/**
 * 값이 오기 전 자리. 로딩임을 형태로 말한다(숫자를 지어내지 않는다).
 *
 * 🔴 면은 `surface-sunken` 이다(2026-08-03). 구 값 `surface-muted` 는 흰 카드 위에서 **1.05:1**
 * (velog 라이트 실측)이라, 라이트 캔버스가 순백이 된 뒤로는 "값이 올 자리"가 사실상 보이지 않았다 —
 * 즉 로딩 화면이 그냥 **빈 화면**으로 읽힌다. `sunken` 은 같은 조건에서 1.11:1 이고 8프리셋 전부에서
 * 흰 면 위 가장 또렷한 중립 칸이다. 셔머 애니메이션을 추가하는 것으로 대신하지 마라(아래 주석 참고).
 */
export const SkeletonBar = styled.span`
  display: inline-block;
  width: 60%;
  min-width: 96px;
  height: 1em;
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
`;

/**
 * 목록 자리의 로딩 골격. 🔴 셔머 애니메이션을 새로 만들지 않는다 — 모양이 정적 단서다
 * (`components/MainContentLoader` 가 세운 규칙, reduced-motion 에서 셔머 없음).
 *
 * 예전에는 44px 짜리 회색 막대 세 줄이었다. 지금은 **실제 행의 골격**(날짜 · 내역 · 금액)을 그려
 * "무엇이 올 자리인가"를 모양만으로 말한다 — 로딩이 끝났을 때 레이아웃이 튀지 않는 것은 덤이다.
 */
export const SkeletonList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const SkeletonRow = styled.span`
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) 96px;
  align-items: center;
  gap: ${space[3]};
  height: 52px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};

  /* 면 근거는 위 SkeletonBar 주석 참고 — 흰 카드 위에서 muted 는 1.05:1 로 보이지 않는다. */
  &::before,
  &::after {
    content: '';
    display: block;
    height: 10px;
    border-radius: ${radius.xs};
    background: ${color.surfaceSunken};
  }

  ${media.down('mobileWide')} {
    grid-template-columns: 56px minmax(0, 1fr) 64px;
  }
`;

/** 스켈레톤 행의 가운데 칸(내역 자리). 의사요소 둘로는 세 칸을 못 만든다. */
export const SkeletonCell = styled.span`
  display: block;
  height: 10px;
  border-radius: ${radius.xs};
  background: ${color.surfaceSunken};
`;

/* ── B-2 신선도(목록 카드 헤더) ───────────────────────────────────────────────── */

/**
 * "언제 기준인가 + 다시 읽기 + 항목 추가" 묶음. `Card` 의 `titleRight` 슬롯에 들어간다.
 *
 * 🔴 시각과 버튼을 **떼어 놓지 않는다** — 새로고침만 있으면 "왜 눌러야 하는지"를, 시각만 있으면
 * "어떻게 최신으로 만드는지"를 잃는다. 좁은 폭에서는 `flex-wrap` 으로 두 줄이 되어도 붙어 있는다.
 * 🔴 2026-08-03 — 히어로에 있던 `항목 추가` 가 여기로 내려왔다. 쓰기 액션은 **그 대상 옆**에 서는
 * 편이 낫고, 히어로는 페이지 정체성(제목·권한 고지)만 남는다. 개수는 변하지 않는다 —
 * 0건 화면에서는 여전히 빈 상태 블록이 그 버튼을 갖는다(한 화면에 추가 버튼은 정확히 1개).
 */
export const ListToolbar = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${space[2]};
  min-width: 0;
`;

/** 🔴 데이터가 아니라 맥락이다 — 강조하지 않는다(숫자에 색을 쓰지 않는 규율의 연장). */
export const ReadAtText = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  white-space: nowrap;
  ${font.numeric}
`;

/** 목록 제목 옆 건수. 색이 아니라 **숫자와 테두리**로 서므로 면 예산과 무관하다. */
export const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 22px;
  padding: 0 ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  ${font.numeric}
`;

/**
 * 재조회 결과가 직전과 달랐다는 한 줄. 🔴 배너가 아니다 — 실패가 아니고 사용자가 할 일도 없다.
 * 낭독은 페이지의 라이브 리전이 맡는다(여기에 `role` 을 또 붙이면 같은 말을 두 번 읽는다).
 */
export const FreshnessNotice = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0 0 ${space[3]};
  padding-left: ${space[3]};
  border-left: 2px solid ${color.border};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/* ── §4.4 이 달 기록 없음 ────────────────────────────────────────────────────── */

/**
 * 이 달에 기록이 없을 때.
 *
 * 🔴 **틴트 면을 쓰지 않는다**(2026-08-03). 예전에는 `accentSubtle` 을 깔았는데, 이 블록은 **표가
 * 사는 data 면 안**이라 채도면이 앉을 자리가 아니고 히어로와 함께 화면의 색 예산을 둘 다 먹었다.
 * 지금은 중립 면 + 파선 테두리 + 글리프 디스크로 "여기는 아직 비어 있다"를 형태로 말한다.
 * 🔴 마스코트를 두지 않는다 — 하마는 **미연결 무대 한 곳**에만 산다(연결 후 화면에는 없다).
 */
export const EmptyBlock = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: clamp(28px, 5vw, 44px) clamp(16px, 3vw, 28px);
  border: 1px dashed ${color.borderStrong};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
  text-align: center;
`;

/** 빈 상태의 글리프 디스크. 폭 56px 이라 면으로 세어지지 않는다(틴트 예산 무관). */
export const EmptyGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.textSecondary};
`;

export const EmptyTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 46ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

/* ── 공통 액션 ──────────────────────────────────────────────────────────────── */

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
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
  padding-left: ${space[3]};
  border-left: 2px solid ${color.warning};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
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

/* ── 고정비 이어가기 ──────────────────────────────────────────────────────────
 * 🔴 이 구획은 **쓰기 직전의 확인 화면**이다. 무엇이 시트에 들어갈지 한 줄씩 보이고, 그래서
 *    목록이 표가 아니라 읽는 글에 가깝다(정렬보다 이름이 먼저 읽혀야 한다).
 * 🔴 손익색 금지 — 이 화면의 규율 그대로다. */

export const CarryOverTitle = styled.h3`
  margin: 0 0 ${space[1]};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const CarryOverBody = styled.p`
  margin: 0 0 ${space[3]};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

export const CarryOverList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0 0 ${space[4]};
  padding: 0;
  list-style: none;
`;

export const CarryOverRow = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[1]} ${space[3]};
  min-width: 0;
`;

export const CarryOverLabel = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: ${font.size.sm};
  color: ${color.text};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CarryOverMeta = styled.span`
  flex: none;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const CarryOverAmount = styled.span`
  flex: none;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  font-variant-numeric: tabular-nums;
`;

/**
 * 주체 범위 줄 — "누구의 것을 볼까요".
 *
 * 🔴 라벨을 컨트롤 **위**에 둔다. 이 줄은 280px 짜리 범위 레일 안에 살고, 가로 배치에서는
 *    셀렉트가 눌려 사람 이름이 잘린다(형제 `LedgerTabPicker` 가 2026-08-03 에 실측한 사고).
 */
export const PayerScopeRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[1]};
  min-width: 0;
`;

export const PayerScopeLabel = styled.label`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;
