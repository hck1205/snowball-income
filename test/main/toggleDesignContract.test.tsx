import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioComposition from '@/components/PortfolioComposition';
import { ToggleField } from '@/components/common';
import YearlyResult from '@/components/YearlyResult';
import PostInvestmentProjectionPanel from '@/pages/Main/components/MainRightPanel/components/PostInvestmentProjectionPanel';
import { ALLOCATION_COPY } from '@/shared/constants';
import type { TickerProfile } from '@/shared/types';
import type { PortfolioCompositionProps } from '@/components/PortfolioComposition';
import type { PostInvestmentDividendProjectionRow } from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

/*
 * GA 계측만 가로챈다 — 나머지 export(ANALYTICS_EVENT 등)는 실물을 그대로 쓴다.
 * (전체치환 목은 배럴에 export가 하나 늘 때마다 조용히 크래시한다 — importOriginal 우선)
 */
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

/**
 * "토글 디자인 통일" 계약 테스트 (사용자 행동 기반).
 *
 * 통일의 내용은 셋이다.
 *  1) 스위치 트랙 안에는 **어떤 글자도 없다** — 모드 의미는 보이는 라벨이 말한다.
 *     (구 API `onText`/`offText`/`controlWidth`/`stateTextColor` 소멸)
 *  2) 모드 스위치 5곳 전부 **보이는 라벨**을 갖고, 스위치 접근명은 그 라벨을 **포함**한다
 *     (WCAG 2.5.3 label-in-name — 음성 명령 사용자가 보이는 글자를 그대로 말해도 잡혀야 한다).
 *  3) 잠금 힌트 카피는 보이는 라벨('잠금')을 그대로 인용하는 **풀 문장**이다.
 *
 * ⚠ 이 파일의 단정은 전부 역할(role)·텍스트 기준이다. className/Emotion 내부 구현은 보지 않는다.
 *    단 하나의 구조 의존은 `switchTrackOf`(체크박스를 감싼 요소 = 트랙)인데, "트랙 **안**에
 *    글자가 없다"는 부정 계약을 표현하려면 트랙 경계를 알아야 해서 불가피하다.
 */

const trackEventMock = vi.mocked(trackEvent);

beforeEach(() => {
  trackEventMock.mockClear();
});

/** 스위치 트랙 = 히든 체크박스를 감싼 요소(Toggle 프리미티브의 유일한 래퍼). */
const switchTrackOf = (control: HTMLElement): HTMLElement => {
  const track = control.parentElement;
  if (!track) throw new Error('스위치 트랙(체크박스의 부모)을 찾지 못했다 — Toggle 구조가 바뀌었나?');
  return track;
};

const escapeForRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 모드 스위치 한 곳의 공통 계약을 한 번에 단정한다.
 *  - 보이는 라벨이 화면에 있다.
 *  - 그 라벨을 **포함하는** 접근명으로 스위치가 잡힌다(= 같은 엘리먼트).
 *  - 트랙 안에는 글자가 없다.
 */
const expectUnifiedModeSwitch = (visibleLabel: string, accessibleName: string): HTMLElement => {
  expect(accessibleName).toContain(visibleLabel);

  const label = screen.getByText(visibleLabel);
  expect(label).toBeInTheDocument();

  const control = screen.getByRole('checkbox', { name: accessibleName });
  // label-in-name: 보이는 라벨만으로도 같은 컨트롤이 잡힌다.
  expect(screen.getByRole('checkbox', { name: new RegExp(escapeForRegExp(visibleLabel)) })).toBe(control);

  // 트랙 무텍스트 — 구 onText/offText가 되살아나면 여기서 죽는다.
  // (`toHaveTextContent('')`는 jest-dom이 빈 문자열을 거부하므로 textContent를 직접 본다)
  expect(switchTrackOf(control).textContent).toBe('');

  return control;
};

/* ── 1. 잠금 힌트 풀 카피 (상수 레벨) ─────────────────────────────────────────── */

describe('ALLOCATION_COPY — 잠금 힌트 정본', () => {
  /**
   * ⚠ 부분일치(`/잠겨/`)로 단정하면 카피가 축약돼도 초록이다 — 반드시 풀 문장 정확일치.
   * 이 문장은 디자이너 확정본이다(바꾸려면 카피 결정을 먼저 바꿔라).
   */
  it('hintLocked 는 디자이너 확정 풀 문장 그대로다', () => {
    expect(ALLOCATION_COPY.hintLocked).toBe(
      "비중 조절이 잠겨 있어요. 오른쪽 위 '잠금' 스위치를 끄면 드래그할 수 있어요."
    );
  });

  /**
   * 힌트는 "오른쪽 위 '잠금' 스위치"라고 화면의 라벨을 인용한다 —
   * 라벨만 바꾸고 힌트를 안 고치면 사용자가 찾을 수 없는 컨트롤을 가리키게 된다.
   */
  it('hintLocked 는 화면에 보이는 스위치 라벨을 따옴표로 그대로 인용한다', () => {
    expect(ALLOCATION_COPY.lockToggleShortLabel).toBe('잠금');
    expect(ALLOCATION_COPY.hintLocked).toContain(`'${ALLOCATION_COPY.lockToggleShortLabel}'`);
  });

  it('접근명은 짧은 라벨보다 길고 그 라벨을 포함한다(label-in-name)', () => {
    expect(ALLOCATION_COPY.lockToggleLabel).toBe('비율 조절 잠금');
    expect(ALLOCATION_COPY.lockToggleLabel).toContain(ALLOCATION_COPY.lockToggleShortLabel);
  });
});

/* ── 2. 포트폴리오 구성 — 잠금 스위치 + 힌트(렌더 레벨) ───────────────────────── */

const makeProfile = (id: string, ticker: string): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield: 0.03,
  dividendGrowth: 0,
  expectedTotalReturn: 0.07,
  frequency: 'quarterly'
});

const StubChart = () => null;

const renderComposition = (profiles: TickerProfile[], overrides: Partial<PortfolioCompositionProps> = {}) => {
  const percentByTickerId = profiles.reduce<Record<string, number>>((acc, profile, _index, arr) => {
    acc[profile.id] = Math.round(100 / arr.length);
    return acc;
  }, {});

  const props: PortfolioCompositionProps = {
    includedProfiles: profiles,
    normalizedAllocation: profiles.map((profile) => ({ profile, weight: 1 / profiles.length })),
    allocationPieOption: {},
    allocationPercentByTickerId: percentByTickerId,
    fixedByTickerId: {},
    adjustableTickerCount: profiles.length,
    onSetTickerWeight: vi.fn(),
    onToggleTickerFixed: vi.fn(),
    onClearAllFixed: vi.fn(),
    onRemoveIncludedTicker: vi.fn(),
    ResponsiveChart: StubChart,
    ...overrides
  };

  render(<PortfolioComposition {...props} />);
  return userEvent.setup();
};

describe('PortfolioComposition 잠금 스위치 — 보이는 라벨 + 풀 힌트', () => {
  it('보이는 라벨 "잠금", 접근명 "비율 조절 잠금", 트랙엔 글자 없음', () => {
    renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')]);

    expectUnifiedModeSwitch(ALLOCATION_COPY.lockToggleShortLabel, ALLOCATION_COPY.lockToggleLabel);
    // 구 트랙 텍스트('조절')는 어디에도 남지 않는다.
    expect(screen.queryByText('조절')).toBeNull();
  });

  /**
   * 렌더 레벨 풀 문장 — `getByText(문자열)`은 기본이 정확일치(normalizer 적용)라
   * 카피가 한 글자라도 줄면 못 찾는다. 부분일치 정규식으로 되돌리지 말 것.
   */
  it('잠금을 켜면 힌트가 풀 문장 그대로 화면에 뜬다', async () => {
    const user = renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB'), makeProfile('c', 'CCC')]);

    await user.click(screen.getByRole('checkbox', { name: ALLOCATION_COPY.lockToggleLabel }));

    expect(screen.getByText(ALLOCATION_COPY.hintLocked)).toBeInTheDocument();
  });

  /** 스크린리더 경로(aria-describedby)로도 같은 풀 문장이 전달돼야 한다. */
  it('잠긴 슬라이더의 접근 설명도 풀 문장이다', async () => {
    const user = renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB'), makeProfile('c', 'CCC')]);

    await user.click(screen.getByRole('checkbox', { name: ALLOCATION_COPY.lockToggleLabel }));

    expect(screen.getByRole('slider', { name: 'AAA 비율' })).toHaveAccessibleDescription(ALLOCATION_COPY.hintLocked);
  });
});

/* ── 3. 결과 밀도 — 간략히 ──────────────────────────────────────────────── */

/**
 * "간략히"는 **결과 요약 카드 우측 상단**에 산다(2026-07-29 이관 — 그전에는 시나리오 탭 줄이었고,
 * 그전에는 결과 카드 헤더였다). 이 파일이 지키는 것은 **토글 자체의 계약**(보이는 라벨 · 접근명 ·
 * 계측 field_name)이지 어느 컴포넌트가 그것을 품느냐가 아니다 — 그래서 소유자가 바뀌어도
 * 여기서는 `ToggleField` 를 직접 렌더해 계약만 본다.
 */
const renderCompactToggle = () => {
  render(
    <Provider store={createStore()}>
      <ToggleField label="간략히" accessibleName="결과 간략히 보기" checked={false} onChange={() => undefined} />
    </Provider>
  );
};

describe('결과 간략히 스위치', () => {
  it('결과 상세도: 보이는 라벨 "간략히" + 접근명 "결과 간략히 보기"', () => {
    renderCompactToggle();

    expectUnifiedModeSwitch('간략히', '결과 간략히 보기');
    // 구 트랙 텍스트('간략'/'상세')는 사라졌다.
    expect(screen.queryByText('간략')).toBeNull();
    expect(screen.queryByText('상세')).toBeNull();
  });
});

/* ── 4. 연도별 결과 — 채우기 ──────────────────────────────────────────────────── */

describe('YearlyResult 면 채우기 스위치', () => {
  it('보이는 라벨 "채우기" + 접근명 "그래프 면 채우기"', () => {
    render(
      <YearlyResult
        items={[{ key: 'asset', label: '자산가치', checked: true, onToggle: vi.fn(), onHelp: vi.fn() }]}
        isFillOn={false}
        onToggleFill={vi.fn()}
        chartOption={{}}
        ResponsiveChart={StubChart}
      />
    );

    expectUnifiedModeSwitch('채우기', '그래프 면 채우기');
    // 구 트랙 텍스트('Color'/'Blank')와 구 라벨('Fill')은 사라졌다.
    expect(screen.queryByText('Color')).toBeNull();
    expect(screen.queryByText('Blank')).toBeNull();
    expect(screen.queryByText('Fill')).toBeNull();
  });

  it('스위치를 켜면 onToggleFill(true)를 부른다', async () => {
    const onToggleFill = vi.fn();
    const user = userEvent.setup();
    render(
      <YearlyResult
        items={[]}
        isFillOn={false}
        onToggleFill={onToggleFill}
        chartOption={{}}
        ResponsiveChart={StubChart}
      />
    );

    await user.click(screen.getByRole('checkbox', { name: '그래프 면 채우기' }));

    expect(onToggleFill).toHaveBeenCalledWith(true);
  });
});

/* ── 5. 투자 종료 후 추정 — 자산 ─────────────────────────────────────────────── */

const projectionRows: PostInvestmentDividendProjectionRow[] = [
  { year: 2050, monthlyDividend: 2_500_000, annualDividend: 30_000_000, assetValue: 1_000_000_000 },
  { year: 2051, monthlyDividend: 2_600_000, annualDividend: 31_200_000, assetValue: 1_050_000_000 }
];

/**
 * 이 패널의 차트는 `React.lazy`(ResponsiveEChart)라 렌더 직후 서스펜스가 풀린다 —
 * 로드를 기다리지 않으면 "not wrapped in act(...)" 경고가 새어 나온다(테스트는 통과하지만 노이즈).
 * echarts-for-react는 setup.ts가 `data-testid="echart"` 스텁으로 갈아끼워 둔다.
 */
const renderProjectionPanel = async (onAssetViewChange = vi.fn()) => {
  render(
    <Provider store={createStore()}>
      <PostInvestmentProjectionPanel
        title="투자 종료 후 추정"
        rows={projectionRows}
        hasData
        emptyMessage="데이터가 없어요."
        projectionYears={10}
        onProjectionYearsChange={vi.fn()}
        isAssetView={false}
        onAssetViewChange={onAssetViewChange}
        yAxisLabelFormatter={(value) => `${value}`}
        chartLabelSuffix=""
      />
    </Provider>
  );
  await screen.findByTestId('echart');
  return userEvent.setup();
};

describe('PostInvestmentProjectionPanel 자산/배당 스위치', () => {
  it('보이는 라벨 "자산" + 접근명 "자산가치로 보기"', async () => {
    await renderProjectionPanel();

    expectUnifiedModeSwitch('자산', '자산가치로 보기');
    // 구 트랙 텍스트('배당')는 사라졌다.
    expect(screen.queryByText('배당')).toBeNull();
  });

  it('스위치를 켜면 onAssetViewChange(true)를 부른다', async () => {
    const onAssetViewChange = vi.fn();
    const user = await renderProjectionPanel(onAssetViewChange);

    await user.click(screen.getByRole('checkbox', { name: '자산가치로 보기' }));

    expect(onAssetViewChange).toHaveBeenCalledWith(true);
  });
});

/* ── 6. GA 계측 계약 — 라벨이 바뀌어도 field_name 은 불변 ─────────────────────── */

/**
 * 라벨·접근명은 UI 카피라 자유롭게 바뀔 수 있지만 `field_name` 은 **GA 시계열의 키**다.
 * 여기서 이름을 바꾸면 과거 데이터와 끊긴다(대시보드가 조용히 반토막 난다).
 * 그래서 카피와 분리해 따로 못박는다 — 이 4개 문자열은 리디자인의 불변식이다.
 * (`targetProgressView`는 토글 자체가 사라져 더 이상 발화되지 않는다 — 과거 데이터는 GA에 남는다.)
 */
describe('토글 GA 계측 — field_name 4종 불변', () => {
  const expectToggleTracked = (fieldName: string, value: boolean) => {
    expect(trackEventMock).toHaveBeenCalledWith(ANALYTICS_EVENT.TOGGLE_CHANGED, {
      field_name: fieldName,
      value
    });
  };

  it('잠금 → allocationLocked', async () => {
    const user = renderComposition([makeProfile('a', 'AAA'), makeProfile('b', 'BBB')]);

    await user.click(screen.getByRole('checkbox', { name: ALLOCATION_COPY.lockToggleLabel }));

    expectToggleTracked('allocationLocked', true);
  });

  /*
   * "간략히"는 2026-07-29 에 결과 요약 카드 우측 상단으로 옮겨가면서, 계측 배선도 그 슬롯을 채우는
   * `MainRightPanel` 로 함께 갔다. 그 컴포넌트를 렌더하려면 시뮬레이션 전체를 세워야 해서
   * 다른 셋처럼 클릭으로 확인할 수 없다 — 대신 **소스 레벨로 field_name 을 잠근다**
   * (`appHeaderSingleSource` 와 같은 방식: 렌더 테스트가 못 잡는 계약을 소스로 지킨다).
   */
  it('간략히 → isResultCompact (배선 위치: MainRightPanel)', () => {
    const source = readFileSync(
      resolve(__dirname, '../../pages/Main/components/MainRightPanel/MainRightPanel.tsx'),
      'utf-8'
    );

    expect(source).toContain("field_name: 'isResultCompact'");
    // 토글 자체의 라벨·접근명 계약은 위 "결과 간략히 스위치" describe 가 지킨다.
    expect(source).toContain("accessibleName=\"결과 간략히 보기\"");
  });

  it('채우기 → isYearlyAreaFillOn', async () => {
    const user = userEvent.setup();
    render(
      <YearlyResult items={[]} isFillOn={false} onToggleFill={vi.fn()} chartOption={{}} ResponsiveChart={StubChart} />
    );

    await user.click(screen.getByRole('checkbox', { name: '그래프 면 채우기' }));

    expectToggleTracked('isYearlyAreaFillOn', true);
  });

  it('자산 → postInvestmentProjectionView', async () => {
    const user = await renderProjectionPanel();

    await user.click(screen.getByRole('checkbox', { name: '자산가치로 보기' }));

    expectToggleTracked('postInvestmentProjectionView', true);
  });
});
