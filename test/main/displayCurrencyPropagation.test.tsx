import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { MainPage } from '@/pages';
import { DISPLAY_CURRENCY_COPY } from '@/shared/constants';
import { openSettingsDrawer } from '@/test';

/**
 * 표시 통화 토글 → **결과 표면 전체**가 함께 바뀌는가.
 *
 * 사용자 요청의 핵심 문장은 "그래프도 전부 토글링"이다. 요약 카드만 바뀌고 차트가 원화로 남는
 * 전파 누락이 이 기능의 가장 큰 리스크라, 여기서는 실제 앱(MainPage)을 띄우고 사용자와 같은
 * 경로(티커 생성 → 스위치 클릭)로 **한 번의 클릭 뒤 모든 표면**을 동시에 단정한다.
 *
 * 캔버스는 화면 텍스트로 안 잡히므로 `echarts-for-react` 를 스텁으로 갈아끼우고, 넘어온 option 의
 * **포맷터를 실제로 호출한 결과**를 DOM 텍스트로 흘려보낸다(옵션 객체 스냅샷이 아니라 라벨 결과를 본다).
 * 스텁은 렌더될 때마다 현재 option 으로 다시 계산하므로 "옛 옵션이 남았는지"까지 드러난다.
 */

/** 차트 포맷터에 넣어볼 원화 기준 금액. 1 USD = 1,000 KRW 로 뒀으므로 달러 모드에서는 $1,000. */
const PROBE_KRW = 1_000_000;

vi.mock('echarts-for-react', () => {
  /** option 안의 "금액을 문자열로 만드는 지점"을 전부 찾아 실제로 호출한다. */
  const probeOption = (option: unknown): string => {
    const source = (option ?? {}) as Record<string, any>;
    const parts: string[] = [];

    for (const axis of ([] as any[]).concat(source.yAxis ?? [])) {
      const formatter = axis?.axisLabel?.formatter;
      if (typeof formatter === 'function') parts.push(String(formatter(PROBE_KRW)));
    }

    const valueFormatter = source.tooltip?.valueFormatter;
    if (typeof valueFormatter === 'function') parts.push(String(valueFormatter(PROBE_KRW)));

    // 파이 중앙 월배당처럼 이미 문자열로 굳은 라벨(graphic)도 함께 본다.
    const collectGraphicText = (node: any): void => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(collectGraphicText);
        return;
      }
      if (typeof node.style?.text === 'string') parts.push(node.style.text);
      collectGraphicText(node.children);
    };
    collectGraphicText(source.graphic);

    return parts.join(' | ');
  };

  return {
    default: ({ option }: { option: unknown }) => <span data-testid="chart-probe">{probeOption(option)}</span>
  };
});

const FX_RATE = { rate: 1_000, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' } as const;

const LAZY_TIMEOUT = { timeout: 3000 };

type User = ReturnType<typeof userEvent.setup>;

/** `/api/fx` 만 응답하고 나머지 네트워크 호출은 드러나게 실패시킨다(조용한 실네트워크 유출 방지). */
const stubFx = (respond: () => Promise<Response>) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url.includes('/api/fx')) return respond();
      throw new Error(`unexpected fetch: ${url}`);
    })
  );
};

const renderApp = (): User => {
  render(
    <Provider store={createStore()}>
      <MainPage />
    </Provider>
  );
  return userEvent.setup();
};

/* 투자 설정은 **전 해상도에서 드로어** 안이다 — 설정을 만지는 동선은 `openSettingsDrawer`(@/test)에서 시작한다. */

/** 사용자와 같은 경로로 프리셋 티커를 하나 담는다 — 여기서부터 결과 영역이 나타난다. */
const createTickerFromPreset = async (user: User, ticker: string): Promise<void> => {
  await openSettingsDrawer(user);
  await user.click(screen.getByRole('button', { name: '티커 생성 열기' }));
  const dialog = await screen.findByRole('complementary', { name: '티커 생성' }, LAZY_TIMEOUT);
  await user.type(within(dialog).getByRole('textbox', { name: '프리셋 티커 검색' }), ticker);
  await user.click(within(dialog).getByRole('option', { name: `${ticker} 선택` }));
  await user.click(within(dialog).getByRole('button', { name: '생성' }));
  // 티커 저장은 드로어를 닫는다(만든 결과를 바로 보여주는 동선) — 설정을 계속 만지려면 다시 연다.
  await openSettingsDrawer(user);
};

const currencyToggle = (): HTMLElement =>
  screen.getByRole('checkbox', { name: DISPLAY_CURRENCY_COPY.toggleAccessibleName });

const currencyGroup = (): HTMLElement => screen.getByRole('group', { name: '결과 표시 통화' });

/** 이름으로 찾은 차트의 "포맷터 실행 결과" 텍스트. 차트가 아직 lazy 로딩 중이면 기다린다. */
const chartProbeText = async (name: string | RegExp): Promise<string> => {
  const wrap = await screen.findByRole('img', { name }, LAZY_TIMEOUT);
  return waitFor(() => {
    const text = within(wrap).getByTestId('chart-probe').textContent ?? '';
    expect(text.length).toBeGreaterThan(0);
    return text;
  }, LAZY_TIMEOUT);
};

/**
 * 결과 요약 카드의 텍스트.
 *
 * 이 카드는 **제목이 없다**(hero 숫자가 첫 요소) — 그래서 앵커는 카드 제목이 아니라 hero 라벨이다.
 * 정밀/간편은 hero 라벨 자체가 갈린다(`최종 자산 가치` / `최종 자산 추정`).
 */
const summaryCardText = (): string => {
  const anchor = screen.queryByText('최종 자산 가치') ?? screen.getByText('최종 자산 추정');
  return anchor.closest('section')?.textContent ?? '';
};

beforeAll(async () => {
  /*
   * TickerModal 은 번들 분리 때문에 lazy(() => import(...)) 다(Main.view.tsx). 전체 스위트의
   * 워커 경합에서는 "티커 생성 열기" 클릭 시점의 첫 모듈 변환(대형 티커 JSON 2종 포함)이
   * 다이얼로그 대기 한도를 넘겨 이 파일만 플레이크가 됐다 — 테스트 밖에서 미리 데워 둔다.
   */
  await import('@/pages/Main/components/TickerModal');
});

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

/**
 * 결과 영역의 차트 7종. 토글 전/후의 접근명을 쌍으로 둔다 —
 * `aria-label` 접미(달러 표시)는 **7종 전부**에 붙는다(라인 차트 패널 4곳 포함).
 *
 * 파이는 축·툴팁에 금액 포맷터가 없고 중앙 그래픽 텍스트만 금액이라(`약 3.2억`) 원화 표식이
 * `₩` 가 아니다 — 그래서 원화 판정을 마커별로 나눈다.
 */
const CHART_MATRIX: Array<{ krw: string | RegExp; usd: string | RegExp; krwMarker: string }> = [
  { krw: '포트폴리오 비중 원형 차트', usd: '포트폴리오 비중 원형 차트 (달러 표시)', krwMarker: '약 ' },
  { krw: '월 평균 배당 차트', usd: '월 평균 배당 차트 (달러 표시)', krwMarker: '₩' },
  { krw: '자산 가치 차트', usd: '자산 가치 차트 (달러 표시)', krwMarker: '₩' },
  { krw: '누적 배당 차트', usd: '누적 배당 차트 (달러 표시)', krwMarker: '₩' },
  { krw: '연도별 자산 및 배당 추이 차트', usd: '연도별 자산 및 배당 추이 차트 (달러 표시)', krwMarker: '₩' },
  {
    krw: '선택 연도의 월별 실지급 배당 차트',
    usd: '선택 연도의 월별 실지급 배당 차트 (달러 표시)',
    krwMarker: '₩'
  },
  {
    krw: /투자 종료 후 월배당 성장 추정.*차트$/,
    usd: /투자 종료 후 월배당 성장 추정.*차트 \(달러 표시\)/,
    krwMarker: '₩'
  }
];

describe('표시 통화 토글의 자리 — 투자 설정 카드 안', () => {
  /**
   * 사용자 결정으로 토글이 결과 컬럼 최상단 → **투자 설정 카드 안**으로 옮겨졌다.
   * 그래서 "결과가 있을 때만 보인다"는 옛 전제가 깨진다 — 설정 카드는 항상 보이므로 토글도 항상 보인다.
   *
   * 빈 상태에서 보이는 게 맞다고 본 근거: 이 컨트롤은 결과의 부속이 아니라 **환경설정**이다
   * ("빠른 추정 보기"·"그래프 나누어 보기"와 같은 성격). 티커를 담기 전에 미리 달러로 맞춰 두면
   * 첫 결과부터 원하는 통화로 나온다 — 그 사이 사라졌다 나타나는 컨트롤이 오히려 혼란스럽다.
   */
  it('티커를 담기 전(빈 상태)에도 투자 설정 패널 안에 있다', async () => {
    stubFx(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }));
    const user = renderApp();
    await openSettingsDrawer(user);

    const settingsPanel = await screen.findByRole('complementary', { name: '투자 설정' }, LAZY_TIMEOUT);
    await waitFor(() => expect(within(settingsPanel).getByRole('group', { name: '결과 표시 통화' })).toBeInTheDocument());
    await waitFor(() => expect(currencyToggle()).toBeEnabled(), LAZY_TIMEOUT);

    // 결과 영역이 없어도 캡션(role=status)은 마운트되어 있다 — 상태 전이가 낭독되는 계약은 자리와 무관하다.
    expect(within(currencyGroup()).getByRole('status')).toBeInTheDocument();
  }, 30_000);

  /** 결과 컬럼(구 자리)에는 더 이상 없다 — 두 곳에 동시에 렌더되면 접근명이 중복돼 조회가 깨진다. */
  it('티커를 담아 결과가 나와도 토글은 한 곳(설정 패널)에만 있다', async () => {
    stubFx(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    expect(screen.getAllByRole('group', { name: '결과 표시 통화' })).toHaveLength(1);
    const settingsPanel = screen.getByRole('complementary', { name: '투자 설정' });
    expect(settingsPanel).toContainElement(currencyToggle());
  }, 30_000);
});

describe('표시 통화 토글 → 결과 표면 전체 전파', () => {
  it('스위치 한 번으로 요약 카드·차트 7종·배당 합계·파이 중앙이 동시에 달러가 된다', async () => {
    stubFx(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    // 라인 차트 3종(분리 보기)도 함께 검증한다 — 이들은 ChartPanel 이 자체적으로 옵션을 만든다.
    await user.click(screen.getByRole('checkbox', { name: '그래프 나누어 보기' }));

    // ── 토글 전: 전부 원화 (아래 달러 단정이 "그냥 통과"가 아님을 같은 노드로 증명한다) ──
    expect(summaryCardText()).toContain('₩');
    expect(screen.getByText(/배당 합계:/).textContent).toContain('₩');
    for (const { krw, krwMarker } of CHART_MATRIX) {
      const text = await chartProbeText(krw);
      expect(text, `원화 모드인데 원화 표기가 없다: ${String(krw)}`).toContain(krwMarker);
      expect(text, `원화 모드인데 달러 표기가 있다: ${String(krw)}`).not.toContain('$');
    }

    // ── 사용자 행동: 환율이 도착하면 스위치가 열리고, 한 번 누른다 ────────
    await waitFor(() => expect(currencyToggle()).toBeEnabled(), LAZY_TIMEOUT);
    await user.click(currencyToggle());
    expect(currencyToggle()).toBeChecked();

    // ── 토글 후: 결과 표면 전부 달러 ───────────────────────────────────
    const summary = summaryCardText();
    expect(summary).toContain('$');
    expect(summary).not.toContain('₩');

    for (const { usd } of CHART_MATRIX) {
      const text = await chartProbeText(usd);
      expect(text, `차트가 원화로 남았다: ${String(usd)}`).toContain('$');
      expect(text, `차트에 원화 라벨이 남았다: ${String(usd)}`).not.toContain('₩');
    }

    // 실지급 배당 카드의 "배당 합계" 텍스트(차트 밖의 숫자)도 함께 바뀐다.
    expect(screen.getByText(/배당 합계:/).textContent).toContain('$');
    expect(screen.getByText(/배당 합계:/).textContent).not.toContain('₩');

    // 1 USD = 1,000 KRW → 100만원 자리는 $1,000 이다(환산이 실제로 나눈 값인지 확인).
    expect(await chartProbeText('연도별 자산 및 배당 추이 차트 (달러 표시)')).toContain('$1,000');
  }, 30_000);

  it('요약 카드는 상세/간략 양쪽 모두 달러로 표기한다', async () => {
    stubFx(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    await waitFor(() => expect(currencyToggle()).toBeEnabled(), LAZY_TIMEOUT);
    await user.click(currencyToggle());

    // 상세(기본): 정밀 표기 `$1,234`.
    expect(summaryCardText()).toMatch(/\$[\d,]/);

    // 간략: 축약 표기 `약 $1.4M`.
    await user.click(screen.getByRole('checkbox', { name: '결과 간략히 보기' }));
    const compact = summaryCardText();
    expect(compact).toMatch(/약 \$/);
    expect(compact).not.toContain('₩');
    expect(compact).not.toContain('억');

    // 간편(빠른 추정) 카드도 같은 포맷터를 쓴다 — 정밀 카드와 갈라지지 않는지 확인.
    await user.click(screen.getByRole('checkbox', { name: '빠른 추정 보기' }));
    const quick = summaryCardText();
    expect(quick).toMatch(/약 \$/);
    expect(quick).not.toContain('₩');
  }, 30_000);

  it('다시 끄면 모든 표면이 원화로 되돌아온다 (한 방향 전이가 아니다)', async () => {
    stubFx(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    await waitFor(() => expect(currencyToggle()).toBeEnabled(), LAZY_TIMEOUT);
    await user.click(currencyToggle());
    expect(await chartProbeText('연도별 자산 및 배당 추이 차트 (달러 표시)')).toContain('$');

    await user.click(currencyToggle());
    expect(currencyToggle()).not.toBeChecked();

    const back = await chartProbeText('연도별 자산 및 배당 추이 차트');
    expect(back).toContain('₩');
    expect(back).not.toContain('$');
    expect(summaryCardText()).not.toContain('$');
  }, 30_000);
});

describe('$NaN / $Infinity 부재 — 환율 전 경로', () => {
  it('환율 조회 실패: 스위치가 잠기고 사유가 보이며 화면 어디에도 NaN 이 없다', async () => {
    stubFx(async () => {
      throw new Error('network down');
    });
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    await waitFor(
      () => expect(within(currencyGroup()).getByRole('status')).toHaveTextContent(DISPLAY_CURRENCY_COPY.reasonUnavailable),
      LAZY_TIMEOUT
    );
    expect(currencyToggle()).toBeDisabled();
    expect(currencyToggle()).not.toBeChecked();

    // 결과는 원화 그대로 — 달러 포맷터가 rate=null 로 불린 흔적이 없어야 한다.
    expect(summaryCardText()).toContain('₩');
    expect(document.body.textContent ?? '').not.toMatch(/NaN|Infinity|\$undefined|\$null/);
  }, 30_000);

  it('응답이 깨져 rate 를 못 뽑아도(0/문자열) 달러로 넘어가지 않는다', async () => {
    stubFx(async () => new Response(JSON.stringify({ rate: 0, asOf: '' }), { status: 200 }));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    await waitFor(() => expect(currencyToggle()).toBeDisabled(), LAZY_TIMEOUT);
    expect(summaryCardText()).toContain('₩');
    expect(document.body.textContent ?? '').not.toMatch(/NaN|Infinity|\$undefined|\$null/);
  }, 30_000);

  it('환율 로딩 중에는 로딩 사유만 말하고 숫자를 지어내지 않는다', async () => {
    // 영원히 해결되지 않는 요청 = 첫 조회 진행 중 상태.
    stubFx(() => new Promise<Response>(() => undefined));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    expect(within(currencyGroup()).getByRole('status')).toHaveTextContent(DISPLAY_CURRENCY_COPY.reasonLoading);
    expect(currencyToggle()).toBeDisabled();
    expect(document.body.textContent ?? '').not.toMatch(/NaN|Infinity/);
  }, 30_000);
});

describe('접근성 — 표시 통화 스위치', () => {
  it('키보드만으로 전환된다 (포커스 가능한 네이티브 체크박스 + Space)', async () => {
    stubFx(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');
    await waitFor(() => expect(currencyToggle()).toBeEnabled(), LAZY_TIMEOUT);

    const toggle = currencyToggle();
    // Tab 순서에서 빠지지 않는 네이티브 컨트롤이다(tabindex 로 숨기지 않았다).
    expect(toggle.tagName).toBe('INPUT');
    expect(toggle).toHaveAttribute('type', 'checkbox');
    expect(toggle.getAttribute('tabindex')).toBeNull();

    toggle.focus();
    expect(toggle).toHaveFocus();
    await user.keyboard(' ');
    expect(currencyToggle()).toBeChecked();

    await user.keyboard(' ');
    expect(currencyToggle()).not.toBeChecked();
  }, 30_000);

  it('캡션(role=status)은 항상 마운트되어 있고 내용만 바뀐다', async () => {
    stubFx(async () => new Response(JSON.stringify(FX_RATE), { status: 200 }));
    const user = renderApp();
    await createTickerFromPreset(user, 'SCHD');

    // 기본(원화) 모드: 노이즈를 두지 않으려 내용은 비어 있지만 **노드는 있다**
    // (조건부 마운트면 loading→success 전이가 낭독되지 않는다).
    await waitFor(() => expect(currencyToggle()).toBeEnabled(), LAZY_TIMEOUT);
    const status = within(currencyGroup()).getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('');

    await user.click(currencyToggle());
    expect(within(currencyGroup()).getByRole('status')).toHaveTextContent('1달러 = 1,000원');
    // 같은 노드가 내용만 갈아입었다.
    expect(within(currencyGroup()).getByRole('status')).toBe(status);
  }, 30_000);
});
