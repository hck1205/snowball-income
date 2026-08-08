import type { ReactNode } from 'react';
import { Button, Card, DataTable, ErrorBox, HintText } from '@/components/common';
import type { HoldingRow, InvestmentRow, RuleRow } from '../../utils';
import type { LedgerSideTabPanelProps, LedgerSideTabState } from './LedgerSideTabPanel.types';
import {
  EmptyNote,
  HeadLine,
  IntroBlock,
  IntroExample,
  IntroExampleLabel,
  IntroExampleRow,
  IntroFilled,
  IntroList,
  IntroText,
  IntroTitle,
  NegativeMark,
  NetWorthValue,
  PanelBody,
  SrOnly,
  TrendFill,
  TrendList,
  TrendMonth,
  TrendRow,
  TrendTrack,
  TrendValue
} from './LedgerSideTabPanel.styled';

/**
 * 옆탭 패널 — `자산` · `투자` · `분류 규칙` 을 **읽어서 보여 준다.**
 *
 * ## 🔴 이 패널은 시트에 쓰지 않는다
 *
 * 적는 것은 시트에서 한다. 앱에 입력 폼을 또 만들면 같은 값을 넣는 길이 둘이 되고, 두 길의 검증이
 * 갈리는 순간 어느 쪽이 맞는지 아무도 모른다. 대신 **그 탭으로 바로 가는 링크**를 준다 —
 * 시트가 이미 좋은 입력 도구이고(드롭다운·서식·보호까지 우리가 깔아 뒀다) 그것을 다시 만들 이유가 없다.
 *
 * ⚠ `가계부` 탭만은 예외로 앱에도 입력이 있다. 기록은 하루에 여러 번 넣는 일이라 왕복 비용이
 *   달라서다(자산은 한 달에 한 번, 투자는 그보다 드물다).
 *
 * ## 🔴 손익색 금지 · 색 단독 채널 금지
 *
 * 순자산이 음수인 달도 막대 색이 같다. 부호는 `-3,000,000원` 이라는 **글자**와
 * `부채가 더 많습니다` 표시가 말한다.
 */

type SideTab = LedgerSideTabPanelProps['tab'];

/**
 * 옆탭의 **설명 블록** — "이 탭이 무엇을 하는가".
 *
 * ## 왜 설명이 필요한가 (2026-08-08 사용자 지적)
 *
 * `자산`·`투자` 는 이름만 봐도 무엇을 적는지 안다. **`분류 규칙` 은 다르다** — 이름이 기능을
 * 설명하지 않고, 빈 표를 처음 본 사람은 여기에 무엇을 왜 적는지 알 방법이 없다. 사용자가
 * 직접 "분류 규칙이 정확히 뭘 하는 거지?"라고 물었고, 그 질문이 나왔다는 것 자체가 화면의 결함이다.
 *
 * ## 🔴 말보다 예시 한 줄
 *
 * "포함하는 말이 든 기록을 그 항목으로 분류합니다" 는 정확하지만 읽어도 그림이 안 그려진다.
 * **내가 적는 것 → 히포가 채우는 것**을 나란히 보여 주는 편이 빠르다.
 *
 * ⚠ 이 함수는 **본체 파일에 산다.** 처음에 `LedgerSideTabPanel.intro.tsx` 로 뺐다가 되돌렸다 —
 *   구조 가드(`test/shared/structureRules.test.ts`)가 컴포넌트 폴더의 파일 접미사를
 *   `.tsx`/`.styled.ts`/`.types.ts`/`.utils.ts`/`.view.tsx`/테스트 로 잠그고 있어 새 접미사를 만들 수 없다.
 *   JSX 라 `.utils.ts` 로도 못 간다.
 */

/** 규칙이 하나도 없을 때만 예시를 크게 보여 준다 — 이미 쓰고 있으면 설명이 소음이다. */
const renderSideTabIntro = (
  tab: SideTab,
  isEmpty: boolean
): ReactNode => {
  if (tab !== 'rules') return null;

  return (
    <IntroBlock aria-labelledby="ledger-rules-intro-title">
      <IntroTitle id="ledger-rules-intro-title">이 표가 하는 일</IntroTitle>

      <IntroText>
        {'“이 말이 들어 있으면 이 항목으로 봐라”를 히포에게 가르치는 표입니다. '}
        {'한 줄 적어 두면 다음부터는 가계부에 내용만 적어도 항목·상세항목·구분이 저절로 채워집니다.'}
      </IntroText>

      {isEmpty ? (
        <IntroExample>
          <IntroExampleRow>
            <IntroExampleLabel>규칙 한 줄</IntroExampleLabel>
            <span>{'포함하는 말 “스타벅스” → 항목 “식비” · 상세항목 “카페”'}</span>
          </IntroExampleRow>
          <IntroExampleRow>
            <IntroExampleLabel>내가 적는 것</IntroExampleLabel>
            <span>{'8월 2일 · 5,600원 · 스타벅스 아메리카노'}</span>
          </IntroExampleRow>
          <IntroExampleRow>
            <IntroExampleLabel>히포가 채우는 것</IntroExampleLabel>
            <IntroFilled>{'식비 · 카페 · 지출'}</IntroFilled>
          </IntroExampleRow>
        </IntroExample>
      ) : null}

      <IntroText>
        {'구분(수입·지출·이체)을 따로 적지 않아도 되는 것은, 항목마다 그 값이 이미 정해져 있기 때문입니다. '}
        {'항목이 정해지면 구분은 따라옵니다.'}
      </IntroText>

      <IntroList>
        <li>
          {'이미 적어 두신 항목은 '}
          <strong>{'건드리지 않습니다'}</strong>
          {'. 히포가 채우는 것은 빈 칸뿐입니다.'}
        </li>
        <li>
          {'규칙으로도 사전으로도 정하지 못하면 '}
          <strong>{'미분류로 둡니다'}</strong>
          {'. 그럴듯한 항목을 지어 넣지 않습니다.'}
        </li>
        <li>{'마음에 들지 않는 줄은 시트에서 고치시면 됩니다. 다음 분류부터 그대로 따릅니다.'}</li>
        <li>{'긴 말이 먼저 걸립니다. “배달음식”과 “음식”이 함께 있으면 “배달음식”이 이깁니다.'}</li>
      </IntroList>
    </IntroBlock>
  );
};

const HOLDING_COLUMNS = [
  { key: 'date', header: '날짜', render: (row: HoldingRow) => row.date },
  {
    key: 'kindLabel',
    header: '종류',
    render: (row: HoldingRow) => (
      <>
        {row.kindLabel}
        {/* 부채는 순자산에서 빠진다는 사실을 글자로 말한다. */}
        {row.isDebt ? <NegativeMark>순자산에서 뺍니다</NegativeMark> : null}
      </>
    )
  },
  { key: 'name', header: '이름', render: (row: HoldingRow) => row.name },
  { key: 'amountText', header: '금액', render: (row: HoldingRow) => row.amountText },
  { key: 'memo', header: '내용', render: (row: HoldingRow) => row.memo }
];

const INVESTMENT_COLUMNS = [
  { key: 'account', header: '계좌', render: (row: InvestmentRow) => row.account },
  { key: 'ticker', header: '티커', render: (row: InvestmentRow) => row.ticker },
  { key: 'sharesText', header: '수량', render: (row: InvestmentRow) => row.sharesText },
  {
    key: 'unitCostText',
    header: '매입단가',
    /* 🔴 안 적은 칸은 `—` 다. `0원` 으로 적으면 공짜로 받은 것처럼 읽힌다. */
    render: (row: InvestmentRow) => row.unitCostText ?? '—'
  },
  { key: 'memo', header: '내용', render: (row: InvestmentRow) => row.memo }
];

const RULE_COLUMNS = [
  { key: 'contains', header: '포함하는 말', render: (row: RuleRow) => row.contains },
  { key: 'categoryLabel', header: '항목', render: (row: RuleRow) => row.categoryLabel },
  { key: 'subcategoryLabel', header: '상세항목', render: (row: RuleRow) => row.subcategoryLabel },
  { key: 'fixityLabel', header: '고정', render: (row: RuleRow) => row.fixityLabel }
];

const TITLE: Readonly<Record<SideTab, string>> = {
  holdings: '자산',
  investments: '투자',
  rules: '분류 규칙'
};

const EMPTY_NOTE: Readonly<Record<SideTab, string>> = {
  holdings: '아직 적은 잔액이 없습니다. 달마다 한 번, 월말에 통장·적금·부채를 적어 두시면 순자산이 나옵니다.',
  investments: '아직 적은 종목이 없습니다. 티커와 수량을 적어 두시면 배당이 얼마 들어올지 계산해 드립니다.',
  rules:
    '아직 규칙이 없습니다. 앱에서 분류를 고치시면 그 줄이 여기 쌓이고, 다음부터는 히포가 저절로 같게 봅니다.'
};

/** 알아보지 못한 줄을 알린다. 🔴 조용히 버리는 것과 버린 사실을 숨기는 것은 다르다. */
const renderSkipped = (skipped: number) =>
  skipped > 0 ? (
    <HintText>{`${skipped.toLocaleString('ko-KR')}줄은 알아보지 못해 표에서 뺐습니다. 날짜·종류·금액을 확인해 주세요.`}</HintText>
  ) : null;

const renderNetWorth = (state: Extract<LedgerSideTabState, { holdings: unknown }>) => {
  const { holdings } = state;
  return (
    <>
      {holdings.latestNetWorthText === null ? null : (
        <div>
          <HeadLine>{`${holdings.latestMonthLabel ?? ''} 기준 순자산`}</HeadLine>
          <NetWorthValue>{holdings.latestNetWorthText}</NetWorthValue>
        </div>
      )}

      {holdings.trend.length > 0 ? (
        <TrendList>
          {holdings.trend.map((point) => (
            <TrendRow key={point.month}>
              <TrendMonth>{point.monthLabel}</TrendMonth>
              {/* 막대는 보조다 — 뜻은 옆의 숫자와 아래 한 문장이 진다. */}
              <TrendTrack aria-hidden>
                <TrendFill style={{ width: `${Math.round(point.ratio * 100)}%` }} />
              </TrendTrack>
              <TrendValue>
                {point.valueText}
                {point.isNegative ? <NegativeMark>부채가 더 많습니다</NegativeMark> : null}
              </TrendValue>
              <SrOnly>{`${point.monthLabel} 순자산 ${point.valueText}`}</SrOnly>
            </TrendRow>
          ))}
        </TrendList>
      ) : null}

      {holdings.rows.length === 0 ? (
        <EmptyNote>{EMPTY_NOTE.holdings}</EmptyNote>
      ) : (
        <DataTable caption="자산 기록" columns={HOLDING_COLUMNS} rows={[...holdings.rows]} />
      )}
      {renderSkipped(holdings.skipped)}
    </>
  );
};

export default function LedgerSideTabPanel({ tab, state, sheetUrl, onRetry }: LedgerSideTabPanelProps) {
  return (
    <Card tone="default" title={TITLE[tab]}>
      <PanelBody>
        {state.status === 'loading' ? <HeadLine>읽고 있습니다…</HeadLine> : null}

        {state.status === 'error' ? (
          <>
            <ErrorBox>{state.message}</ErrorBox>
            <div>
              <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
                다시 읽기
              </Button>
            </div>
          </>
        ) : null}

        {/*
          🔴 설명은 **표 위**에 선다. 아래에 두면 처음 온 사람이 빈 표를 먼저 보고 나가 버린다.
             `분류 규칙` 처럼 이름이 기능을 설명하지 못하는 탭에만 그린다.
        */}
        {state.status === 'ready' && 'rules' in state
          ? renderSideTabIntro(tab, state.rules.rows.length === 0)
          : null}

        {state.status === 'ready' && 'holdings' in state ? renderNetWorth(state) : null}

        {state.status === 'ready' && 'investments' in state ? (
          <>
            {state.investments.rows.length === 0 ? (
              <EmptyNote>{EMPTY_NOTE.investments}</EmptyNote>
            ) : (
              <DataTable caption="투자 기록" columns={INVESTMENT_COLUMNS} rows={[...state.investments.rows]} />
            )}
            {renderSkipped(state.investments.skipped)}
          </>
        ) : null}

        {state.status === 'ready' && 'rules' in state ? (
          <>
            {state.rules.rows.length === 0 ? (
              <EmptyNote>{EMPTY_NOTE.rules}</EmptyNote>
            ) : (
              <DataTable caption="분류 규칙" columns={RULE_COLUMNS} rows={[...state.rules.rows]} />
            )}
            {renderSkipped(state.rules.skipped)}
          </>
        ) : null}

        {/*
          🔴 적는 것은 시트에서 한다 — 앱에 입력 폼을 또 만들면 같은 값을 넣는 길이 둘이 되고,
             두 길의 검증이 갈리는 순간 어느 쪽이 맞는지 아무도 모른다.
        */}
        {sheetUrl ? (
          <HintText>
            {'적는 것은 시트에서 합니다. '}
            <a href={sheetUrl} target="_blank" rel="noreferrer noopener">
              {`시트의 “${TITLE[tab]}” 탭 열기`}
            </a>
          </HintText>
        ) : null}
      </PanelBody>
    </Card>
  );
}
