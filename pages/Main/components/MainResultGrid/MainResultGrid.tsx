import { Fragment, memo } from 'react';
import type { ReactNode } from 'react';
import { ResultGridCell } from '@/components/common';
// 훅 배럴(`@/pages/Main/hooks`)이 아니라 `interaction` 폴더를 직접 가리킨다 — 상위 배럴은 페이지
// 비즈니스 훅까지 끌고 와 `components → hooks → components` 순환이 될 수 있다. 마커 상수만 필요하다.
import { RESULT_CAPTURE_ROOT_ATTRIBUTE } from '@/pages/Main/hooks/interaction';
import type { MainResultGridProps } from './MainResultGrid.types';
import { useFirstResultReveal } from './MainResultGrid.utils';
import { ActBand, ActHint, ActIndex, ActRule, ActTitle, RevealResultGrid } from './MainResultGrid.styled';

/** 슬롯 이름 = 그리드 셀의 key. 배치표가 오탈자로 조용히 빈 칸을 만들지 않게 타입으로 묶는다. */
type SlotKey = keyof MainResultGridProps;

type ResultCell = {
  key: SlotKey;
  /** **짝이 함께 왔을 때**의 폭(12열 기준). */
  span: number;
  /**
   * 한 행을 나눠 쓰는 짝. 짝의 슬롯이 비면 이 칸이 **전 폭(12)** 으로 펴진다 —
   * 고아 칸(반쪽만 서고 나머지가 비는 행)을 배치표 한 곳에서 원리적으로 막는다.
   */
  pairWith?: SlotKey;
};

/**
 * 결과를 읽는 **막(act)**. 카드 여러 장이 하나의 질문에 답하는 묶음이고, 머리띠 한 줄이 그 질문을 적는다.
 *
 * `title` 이 없는 막(리드)은 머리띠를 그리지 않는다 — 첫 화면의 숫자가 곧 제목이라 그 위에 글자를
 * 한 줄 더 얹으면 주인공이 두 명이 된다.
 */
type ResultAct = {
  id: string;
  /** 막 표식(01·02·03). 숫자는 낭독에서 빠진다(장식) — 순서는 DOM 순서가 이미 말한다. */
  index?: string;
  title?: string;
  hint?: string;
  cells: readonly ResultCell[];
};

/**
 * 🔴 **결과 영역의 배치 정본.** 어떤 카드가 어느 막에서, 어떤 폭으로, 몇 번째로 서는가.
 *
 * ## 왜 막으로 나눴나 (2026-08-03 2차 리워크)
 * 이전 배치는 12칸짜리 카드 여덟 장이 **같은 무게로** 세로로 쌓인 목록이었다. 그래서 이 화면에는
 * 위계가 없었다 — 사용자는 "최종 자산"과 "전량 매도 시 양도세"를 같은 크기·같은 면·같은 간격으로
 * 받았고, 어디까지가 한 이야기인지 알 방법이 없었다. 카드를 지우지 않고 위계를 만드는 방법은
 * **묶고 이름을 붙이는 것**이다. 세 막의 질문은 사용자가 실제로 던지는 순서다:
 *
 *   리드   — 지금 이 조건이면 얼마인가       (요약 · 경고)
 *   막 01 — 무엇으로 얼마를 받나             (구성 → 실지급 → 월평균)
 *   막 02 — 기간이 지나면 어떻게 되나         (연도별 → 자산 : 누적)
 *   막 03 — 투자를 마친 뒤                   (투자 종료 후 : 전량 매도)
 *
 * ## 지켜진 기존 결정
 *  - **구성 → 실지급 월별 → 월 평균**(2026-07-28 사용자 지정): 가까운 사실에서 먼 추정으로.
 *    막 01 안의 순서가 그대로다.
 *  - `MonthlyCashflow` 가 `YearlyResult` 보다 앞(2026-07-25): 두 카드는 이제 서로 다른 막에 있고
 *    DOM 순서는 여전히 월별 → 연도별이다.
 *  - **셋 다 전 폭**(월평균·구성·연도별). 2026-07-28 에 7:5 페어를 되돌린 결정을 그대로 둔다 —
 *    차트와 비중 슬라이더는 가로를 다 쓸수록 읽힌다.
 *
 * ## 바뀐 것 — 페어가 둘 늘었다
 *  - `자산 가치 : 누적 배당`(6:6) — 기존. 같은 시간축의 그래프 두 장.
 *  - `투자 종료 후 : 전량 매도`(7:5) — **신규.** 둘 다 "적립을 멈춘 뒤"의 이야기이고, 화면 끝에서
 *    12칸 카드가 두 장 더 이어지면 결과가 아니라 부록이 길어진다. 왼쪽은 계속 받는 그림(차트),
 *    오른쪽은 다 팔았을 때의 세금(부속·sunken)이라 무게도 7:5 가 맞다.
 *  고아 칸 걱정은 배치표가 대신한다 — 위 `pairWith` 규칙이 짝 없는 칸을 자동으로 12칸으로 편다.
 *  (`전량 매도`는 간략 모드에서 사라지는 조건부 카드다. 예전 7:5 페어가 되돌려진 이유가 정확히
 *  이 고아 칸이었고, 이번에는 그것을 규칙으로 막고 나서 페어를 다시 열었다.)
 */
const ACTS: readonly ResultAct[] = [
  {
    id: 'lead',
    cells: [
      { key: 'summary', span: 12 },
      { key: 'financialIncomeBanner', span: 12 }
    ]
  },
  {
    id: 'composition',
    index: '01',
    title: '무엇으로 얼마를 받나',
    hint: '구성 → 실제 지급 → 장기 평균 순서입니다.',
    cells: [
      { key: 'composition', span: 12 },
      { key: 'monthlyCashflow', span: 12 },
      { key: 'monthlyAverageChart', span: 12 }
    ]
  },
  {
    id: 'trajectory',
    index: '02',
    title: '기간이 지나면 어떻게 되나',
    hint: '해마다의 결과와 자산·누적 배당의 궤적입니다.',
    cells: [
      { key: 'yearlyResult', span: 12 },
      { key: 'assetValueChart', span: 6, pairWith: 'cumulativeDividendChart' },
      { key: 'cumulativeDividendChart', span: 6, pairWith: 'assetValueChart' }
    ]
  },
  {
    id: 'after',
    index: '03',
    title: '투자를 마친 뒤',
    hint: '적립을 멈춘 뒤의 배당과, 전량 매도했을 때의 세금입니다.',
    cells: [
      { key: 'postInvestmentProjection', span: 7, pairWith: 'saleTax' },
      { key: 'saleTax', span: 5, pairWith: 'postInvestmentProjection' }
    ]
  },
  {
    id: 'empty',
    cells: [{ key: 'emptyState', span: 12 }]
  }
];

/**
 * 결과 카드 **배치 전용** 컴포넌트. 어떤 카드가 어떤 막에서 어떤 폭으로 어떤 순서에 오는가만 안다 —
 * 데이터는 갖지 않는다.
 *
 * 예외 하나: **첫 결과가 처음 나타나는 순간의 진입 연출**(W3)을 여기서 켠다. 그 전이를 볼 수 있는
 * 유일한 자리이기 때문이다 — 결과일 때와 빈 상태일 때 이 컴포넌트는 같은 자리의 같은 인스턴스라
 * "빈 화면이 결과로 바뀌었다"를 자기 props 만으로 안다. 판정은 `MainResultGrid.utils.ts` 소유.
 */
function MainResultGridComponent(props: MainResultGridProps) {
  /** 값이 든 슬롯만 남긴 막들. 카드가 하나도 없는 막은 **머리띠까지 통째로** 사라진다. */
  const acts = ACTS.map((act) => ({
    act,
    cells: act.cells
      .filter((cell) => Boolean(props[cell.key]))
      .map((cell) => ({
        key: cell.key,
        /* 짝이 안 왔으면 전 폭. 이 한 줄이 고아 칸을 원리적으로 없앤다. */
        span: cell.pairWith && !props[cell.pairWith] ? 12 : cell.span,
        node: props[cell.key] as ReactNode
      }))
  })).filter((entry) => entry.cells.length > 0);

  /*
   * 결과가 실제로 있는가 = 빈 상태 보드만 있는 게 아닌가. 이 그리드는 결과일 때와 빈 상태일 때
   * **같은 자리의 같은 컴포넌트**라 React 가 인스턴스를 재사용한다 — 그래서 훅이 전이를 볼 수 있다.
   */
  const hasResults = acts.some((entry) => entry.cells.some((cell) => cell.key !== 'emptyState'));
  const isRevealing = useFirstResultReveal(hasResults);

  if (acts.length === 0) return null;

  /*
   * 결과 **이미지 저장**의 캡처 대상 표식. 이 요소가 곧 "지금 탭의 결과 카드 전부"이고,
   * 시나리오 탭 바는 이 밖(보드 머리)이라 캡처에 들어가지 않는다.
   *
   * 캡처는 이 **살아 있는 요소를 그대로** 찍는다 — 한때 고정 폭 오프스크린 사본을 만들어
   * 그쪽을 찍었지만, 사본은 카드 높이·표 폭이 화면과 계속 어긋났다(자세한 경위는
   * `resultCapturePipeline` 주석). 래스터라이저가 브라우저라 사본이 필요 없다.
   */
  return (
    <RevealResultGrid $reveal={isRevealing} {...{ [RESULT_CAPTURE_ROOT_ATTRIBUTE]: '' }}>
      {acts.map(({ act, cells }) => (
        <Fragment key={act.id}>
          {act.title ? (
            <ActBand>
              {/* 표식은 장식이다 — 순서는 DOM 이 이미 말하고, 낭독에 "영일"이 끼면 소음이다. */}
              {act.index ? <ActIndex aria-hidden="true">{act.index}</ActIndex> : null}
              {/*
               * 🔴 `h2` 다. 공용 `Card` 가 카드 제목을 `h2` 로 그리므로 그 위에 `h3` 를 두면
               *    레벨이 **역전**된다(h3 → h2). 역전보다는 평평한 편이 보조기기에 낫다.
               */}
              <ActTitle>{act.title}</ActTitle>
              <ActRule aria-hidden="true" />
              {act.hint ? <ActHint>{act.hint}</ActHint> : null}
            </ActBand>
          ) : null}
          {cells.map((cell) => (
            <ResultGridCell key={cell.key} $span={cell.span}>
              {cell.node}
            </ResultGridCell>
          ))}
        </Fragment>
      ))}
    </RevealResultGrid>
  );
}

const MainResultGrid = memo(MainResultGridComponent);

export default MainResultGrid;
