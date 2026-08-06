import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { baseViewModel, ledgerRow, renderLedgerView, TWO_ROWS, ZERO_SUMMARY } from './ledgerFixtures';

/**
 * `/ledger` **화면 상태 계약**.
 *
 * 이 화면은 라우터를 거쳐 열 수 없다(테스트 환경에 구글 자격증명이 없어 라우트가 배열에 없다).
 * 그래서 뷰를 직접 렌더해 상태별 계약을 잠근다 — 그러지 않으면 `connected` 이후의 모든 상태가
 * **테스트 0개**로 남는다.
 *
 * 🔴 기대 문자열은 전부 **리터럴**이다. `LEDGER_COPY` 를 기대값으로 재사용하면 카피가 바뀌어도
 * 양쪽이 함께 움직여 회귀를 못 잡는다(동어반복).
 */

describe('/ledger — 연결 후 목록', () => {
  it('월 네비·주역 요약 카드·거래 내역 표가 함께 선다', () => {
    renderLedgerView(baseViewModel());

    expect(screen.getByRole('heading', { level: 1, name: 'Hungry Hippo 가계부' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2026년 8월' })).toBeInTheDocument();

    // 🔴 제목 없는 주역 카드는 월 제목을 자기 이름으로 삼는다(aria-labelledby).
    expect(screen.getByRole('region', { name: '2026년 8월' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: '거래 내역' })).toBeInTheDocument();
    expect(screen.getByText('시트에 적힌 순서 그대로 보여 줍니다.')).toBeInTheDocument();

    const table = screen.getByRole('table', { name: '2026년 8월 수입·지출 기록' });
    expect(within(table).getByText('식비')).toBeInTheDocument();
    expect(within(table).getByText('급여')).toBeInTheDocument();
  });

  it('행 금액은 부호 없는 절대값이고 방향은 구분 칩이 말한다', () => {
    renderLedgerView(baseViewModel());

    const table = screen.getByRole('table');
    // 🔴 지출 행에도 `-` 가 붙지 않는다. 손익색도 없고, 방향은 "지출" 텍스트가 담당한다.
    expect(within(table).getByText('₩12,000')).toBeInTheDocument();
    expect(within(table).queryByText('-₩12,000')).not.toBeInTheDocument();
    expect(within(table).getByText('지출')).toBeInTheDocument();
    expect(within(table).getByText('수입')).toBeInTheDocument();
  });

  it('순액만 부호를 갖는다 — 요약 카드가 그 값을 그대로 낸다', () => {
    renderLedgerView(
      baseViewModel({
        summary: {
          incomeText: '₩1,000,000',
          expenseText: '₩1,320,000',
          netText: '-₩320,000',
          incomeCount: 1,
          expenseCount: 4
        }
      })
    );

    const summary = screen.getByRole('region', { name: '2026년 8월' });
    expect(within(summary).getByText('2026년 8월 순액')).toBeInTheDocument();
    expect(within(summary).getByText('-₩320,000')).toBeInTheDocument();
    expect(within(summary).getByText('수입에서 지출을 뺀 금액입니다.')).toBeInTheDocument();
    expect(within(summary).getByText('4건')).toBeInTheDocument();
  });

  it('행 액션의 접근명에 행 맥락(날짜·분류·금액)이 들어간다', () => {
    renderLedgerView(baseViewModel());

    expect(screen.getByRole('button', { name: '8월 3일 (월) 식비 ₩12,000 기록 수정' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '8월 3일 (월) 식비 ₩12,000 기록 삭제' })).toBeEnabled();
  });

  it('월 이동 버튼이 컨테이너 핸들러를 부른다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(baseViewModel({ isCurrentMonth: false }));

    await user.click(screen.getByRole('button', { name: '이전 달로 이동, 2026년 7월' }));
    await user.click(screen.getByRole('button', { name: '다음 달로 이동, 2026년 9월' }));
    await user.click(screen.getByRole('button', { name: '이번 달로 돌아가기, 2026년 8월' }));

    expect(handlers.onPrevMonth).toHaveBeenCalledTimes(1);
    expect(handlers.onNextMonth).toHaveBeenCalledTimes(1);
    expect(handlers.onThisMonth).toHaveBeenCalledTimes(1);
  });
});

describe('/ledger — 연결 전과 연결 후 0건은 다른 화면이다', () => {
  it('연결 전(disconnected)에는 월 네비도 요약 카드도 없다', () => {
    renderLedgerView(baseViewModel({ state: 'disconnected', rows: [], summary: ZERO_SUMMARY }));

    expect(screen.getByRole('heading', { level: 2, name: '가계부를 시작하는 방법을 고릅니다' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: '2026년 8월' })).not.toBeInTheDocument();
    // 🔴 주역(raised) 카드는 connected 에서만 존재한다 — 여기서는 히어로가 시선을 받는다.
    expect(screen.queryByRole('region', { name: '2026년 8월' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('연결 후 0건에는 월 네비·요약 카드가 남아 "연결은 정상"을 증명한다', () => {
    renderLedgerView(baseViewModel({ rows: [], summary: ZERO_SUMMARY }));

    expect(screen.getByRole('heading', { level: 2, name: '2026년 8월' })).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: '2026년 8월' });
    // 🔴 0원은 실제 값이다 — 숨기면 사용자가 연결 실패로 오해한다.
    expect(within(summary).getAllByText('₩0').length).toBe(3);

    expect(screen.getByRole('heading', { level: 2, name: '거래 내역' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: '이번 달 기록이 없습니다.' })).toBeInTheDocument();
    expect(
      screen.getByText('시트에 아직 기록이 없습니다. 첫 항목을 추가하면 이 시트에 저장됩니다.')
    ).toBeInTheDocument();
  });

  it('0건 화면에서 "항목 추가"는 화면에 정확히 1개(히어로가 아니라 빈 상태가 갖는다)', () => {
    renderLedgerView(baseViewModel({ rows: [], summary: ZERO_SUMMARY }));

    expect(screen.getAllByRole('button', { name: '항목 추가' }).length).toBe(1);
    expect(screen.getByRole('button', { name: '연결된 구글 시트를 새 탭에서 열기' })).toBeInTheDocument();
  });

  it('다른 달에 기록이 있으면 그 사실을 말하고 그 달로 가는 버튼을 준다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({ rows: [], summary: ZERO_SUMMARY, isCurrentMonth: false, latestMonthLabel: '2026년 5월' })
    );

    expect(screen.getByRole('heading', { level: 3, name: '2026년 8월에 기록이 없습니다.' })).toBeInTheDocument();
    expect(screen.getByText('가장 최근 기록은 2026년 5월에 있습니다.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2026년 5월로 이동' }));
    expect(handlers.onGoLatestMonth).toHaveBeenCalledTimes(1);
  });
});

describe('/ledger — 토큰 만료(§4.7)', () => {
  const expired = () => baseViewModel({ isExpired: true });

  it('🔴 목록이 백지가 되지 않는다 — 마지막으로 읽은 기록이 그대로 남는다', () => {
    renderLedgerView(expired());

    const table = screen.getByRole('table');
    expect(within(table).getByText('식비')).toBeInTheDocument();
    expect(within(table).getByText('급여')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '2026년 8월' })).toBeInTheDocument();
  });

  it('만료 배너와 1클릭 재연결이 함께 나온다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(expired());

    const banner = screen.getByRole('alert');
    expect(within(banner).getByText('연결이 만료되었습니다')).toBeInTheDocument();
    expect(
      within(banner).getByText(
        '구글 시트 연결이 만료되어 지금은 읽기만 할 수 있습니다. 아래 내용은 마지막으로 읽은 기록입니다.'
      )
    ).toBeInTheDocument();

    await user.click(within(banner).getByRole('button', { name: '다시 연결' }));
    expect(handlers.onReconnect).toHaveBeenCalledTimes(1);
  });

  it('🔴 쓰기 버튼이 전부 비활성이고 **같은** 사유 줄 하나를 가리킨다(무음 비활성 금지)', () => {
    renderLedgerView(expired());

    const hintText =
      '연결이 만료되어 지금은 기록을 추가하거나 고칠 수 없습니다. 다시 연결하면 하던 작업을 이어서 진행합니다.';
    const hint = screen.getByText(hintText);
    expect(hint.id).not.toBe('');

    const writeButtons = [
      screen.getByRole('button', { name: '항목 추가' }),
      screen.getByRole('button', { name: '8월 3일 (월) 식비 ₩12,000 기록 수정' }),
      screen.getByRole('button', { name: '8월 3일 (월) 식비 ₩12,000 기록 삭제' })
    ];

    for (const button of writeButtons) {
      expect(button).toBeDisabled();
      expect(button.getAttribute('aria-describedby')).toBe(hint.id);
    }

    // 같은 문장을 버튼 수만큼 그리면 스크린리더가 같은 말을 열 번 읽는다.
    expect(screen.getAllByText(hintText).length).toBe(1);
  });

  it('읽기(월 이동)는 계속 시도할 수 있다 — 비활성은 쓰기에만 적용한다', () => {
    renderLedgerView(baseViewModel({ isExpired: true, isCurrentMonth: false }));

    expect(screen.getByRole('button', { name: '이전 달로 이동, 2026년 7월' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '다음 달로 이동, 2026년 9월' })).toBeEnabled();
  });
});

describe('/ledger — 쓰기 실패의 잔류(§4.8)', () => {
  const failedRow = ledgerRow({
    failure: { reason: 'network', body: '네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.', retryAfterSec: null }
  });

  it('🔴 실패는 토스트가 아니라 **그 행 안에** 라벨·사유·재시도로 남는다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(baseViewModel({ rows: [failedRow, TWO_ROWS[1]] }));

    const table = screen.getByRole('table');
    // thead 를 뺀 각 `tbody` 가 한 기록이다 — 실패 줄이 그 기록 안에 있어야 사라지지 않는다.
    const group = within(table)
      .getAllByRole('rowgroup')
      .find((node) => within(node).queryByText('식비') !== null);
    expect(group).toBeDefined();

    expect(within(group as HTMLElement).getByText('저장 실패')).toBeInTheDocument();
    expect(
      within(group as HTMLElement).getByText(
        '네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.'
      )
    ).toBeInTheDocument();

    const retry = within(group as HTMLElement).getByRole('button', {
      name: '8월 3일 (월) 식비 ₩12,000 기록 다시 저장'
    });
    await user.click(retry);
    expect(handlers.onRetryRow).toHaveBeenCalledWith('snap-1:2');
  });

  it('개별 실패 줄은 role 을 갖지 않는다 — 10건 실패에서 10번 끼어들지 않는다', () => {
    renderLedgerView(baseViewModel({ rows: [failedRow] }));

    // 실패 줄에 role="alert" 가 붙었다면 이 화면의 유일한 alert 자리를 차지한다.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('429 는 다른 실패와 다른 문장을 쓰고 카운트다운 라벨을 단다', () => {
    const rateLimited = ledgerRow({
      failure: {
        reason: 'rateLimited',
        body: '짧은 시간에 요청이 많아 구글이 잠시 제한했습니다. 잠시 뒤에 다시 시도해 주세요.',
        retryAfterSec: 30
      }
    });

    renderLedgerView(baseViewModel({ rows: [rateLimited] }), { retryCountdowns: new Map([['snap-1:2', 27]]) });

    expect(
      screen.getByText('짧은 시간에 요청이 많아 구글이 잠시 제한했습니다. 잠시 뒤에 다시 시도해 주세요.')
    ).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: '8월 3일 (월) 식비 ₩12,000 기록 다시 저장' });
    expect(retry).toHaveTextContent('다시 시도 (27초)');
    expect(retry).toBeDisabled();
  });
});

describe('/ledger — 부분 실패는 건별로 남는다(§4.8)', () => {
  const queued = (id: string, category: string, amountText: string, reasonBody: string) =>
    ledgerRow({
      id,
      category,
      amountText,
      failure: { reason: 'network', body: reasonBody, retryAfterSec: null }
    });

  const model = {
    successCount: 2,
    totalCount: 5,
    hasBatchReport: true,
    rows: [
      queued('queued-1', '식비', '₩12,000', '네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.'),
      queued('queued-2', '교통', '₩1,250', '이 시트에 쓸 권한이 없습니다. 구글 시트에서 편집 권한을 확인해 주세요.'),
      queued('queued-3', '통신', '₩55,000', '시트에 저장하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.')
    ],
    isRetryAllBlocked: false
  };

  it('🔴 "M건 저장됨 / 전체 N건" 을 숫자로 말한다 — 뭉뚱그린 성공/실패가 아니다', () => {
    renderLedgerView(baseViewModel({ partialFailure: model }));

    const banner = screen.getByRole('alert');
    expect(within(banner).getByText('5건 중 2건을 저장했습니다')).toBeInTheDocument();
    expect(
      within(banner).getByText(
        '저장하지 못한 3건은 아래 목록에 그대로 남아 있습니다. 항목마다 사유를 확인하고 다시 시도할 수 있습니다.'
      )
    ).toBeInTheDocument();
  });

  it('실패 3건이 **건별로** 사유와 재시도 버튼을 갖는다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(baseViewModel({ partialFailure: model }));

    const list = screen.getByRole('heading', { level: 2, name: '저장하지 못한 기록' }).closest('section');
    expect(list).not.toBeNull();
    const listEl = list as HTMLElement;

    expect(within(listEl).getAllByText('저장 실패').length).toBe(3);
    expect(within(listEl).getByText('8월 3일 (월) · 지출 · 식비 · ₩12,000')).toBeInTheDocument();
    expect(
      within(listEl).getByText('이 시트에 쓸 권한이 없습니다. 구글 시트에서 편집 권한을 확인해 주세요.')
    ).toBeInTheDocument();

    await user.click(within(listEl).getByRole('button', { name: '8월 3일 (월) 교통 ₩1,250 기록 다시 저장' }));
    expect(handlers.onRetryRow).toHaveBeenCalledWith('queued-2');
  });

  it('429 가 섞이면 "모두 다시 시도"가 비활성이고 사유 줄을 가리킨다', () => {
    renderLedgerView(baseViewModel({ partialFailure: { ...model, isRetryAllBlocked: true } }));

    const retryAll = screen.getByRole('button', { name: '모두 다시 시도' });
    expect(retryAll).toBeDisabled();
    const hint = screen.getByText('요청 제한이 풀린 뒤에 다시 시도할 수 있습니다.');
    expect(retryAll.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('한 건짜리 실패에는 "1건 중 0건" 같은 소음 배너를 내지 않는다', () => {
    renderLedgerView(
      baseViewModel({
        partialFailure: { successCount: 0, totalCount: 1, hasBatchReport: false, rows: [model.rows[0]], isRetryAllBlocked: false }
      })
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '저장하지 못한 기록' })).toBeInTheDocument();
  });
});

describe('/ledger — 권한 거부 · 팝업 차단 · 생성 직후', () => {
  it('권한 거부는 연결 전 화면으로 복귀하고 배너 + 영향 없음 안내를 얹는다', () => {
    renderLedgerView(baseViewModel({ state: 'denied', rows: [], summary: ZERO_SUMMARY, isDenied: true }));

    expect(screen.getByText('시트 접근 권한이 없어 연결하지 못했습니다')).toBeInTheDocument();
    expect(
      screen.getByText(
        '구글 동의 화면에서 접근을 허용해야 가계부를 쓸 수 있습니다. 이 앱은 사용자가 선택한 시트 1개만 읽고 씁니다. 다른 드라이브 파일에는 접근하지 않습니다.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('포트폴리오·시뮬레이터 등 다른 기능은 그대로 사용할 수 있습니다.')).toBeInTheDocument();
    // §4.1 로 복귀했다는 증거.
    expect(screen.getByRole('heading', { level: 2, name: '가계부를 시작하는 방법을 고릅니다' })).toBeInTheDocument();
  });

  it('팝업 차단은 예외가 아니라 배너로 말한다', () => {
    renderLedgerView(baseViewModel({ isPopupBlocked: true }));

    expect(
      screen.getByText(
        '브라우저가 팝업을 막아 구글 창을 열지 못했습니다. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.'
      )
    ).toBeInTheDocument();
  });

  /**
   * 🔴 **여는 길은 이 카드에 하나뿐이다**(2026-08-01 사용자 결정).
   *
   * 예전에는 시트 이름 링크 + "구글 시트에서 열기" 버튼이 **둘 다** 있었고, 히어로에도 상시
   * `시트에서 열기` 가 있어 같은 동작으로 가는 길이 한 화면에 셋이었다. 버튼 하나만 남겼다 —
   * 이 카드는 생성 직후의 안내라 "지금 열어 본다"가 유일한 다음 행동이고, 눌러야 할 것처럼 보여야 한다.
   *
   * 그래서 **링크가 다시 생기면 이 테스트가 실패**한다(중복 복원을 막는 것이 이 단정의 목적이다).
   */
  it('시트 생성 직후 배너에서 여는 길은 버튼 하나뿐이다 (링크 중복 금지)', () => {
    renderLedgerView(baseViewModel({ showCreatedNotice: true, rows: [], summary: ZERO_SUMMARY }));

    expect(screen.getByText('가계부 시트를 만들었습니다')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '새로 만든 구글 시트를 새 탭에서 열기' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '새로 만든 구글 시트를 새 탭에서 열기' })
    ).not.toBeInTheDocument();
    // 🔴 연결 전 화면으로 되돌리지 않는다 — 방금 만든 시트라 0건 화면이 온다.
    expect(screen.getByRole('heading', { level: 3, name: '이번 달 기록이 없습니다.' })).toBeInTheDocument();
  });
});
