import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LedgerMappingModel } from '@/pages/Ledger/types';
import { baseViewModel, renderLedgerView, ZERO_SUMMARY } from './ledgerFixtures';

/** §4.1 연결 전 · §4.2 열 매핑. */

const disconnected = () =>
  baseViewModel({ state: 'disconnected', rows: [], summary: ZERO_SUMMARY, sheetMetaLine: null, sheetUrl: null, sheetName: null });

const mappingModel = (overrides: Partial<LedgerMappingModel> = {}): LedgerMappingModel => ({
  sheetName: '우리집 가계부',
  columns: [
    { letter: 'A', header: '사용일자' },
    { letter: 'B', header: '구분' },
    { letter: 'C', header: '' }
  ],
  draft: { date: 'A', kind: 'B', amount: null, category: null, memo: null },
  matchedCount: 2,
  missingNames: ['금액', '분류'],
  previewRows: [],
  canPreview: false,
  allUnreadable: false,
  isPreviewLoading: false,
  ...overrides
});

describe('§4.1 연결 전 — 두 선택지의 무게가 같다', () => {
  it('동일 마크업의 두 타일이 서고, 동의 안내가 함께 나온다', () => {
    renderLedgerView(disconnected());

    expect(screen.getByRole('heading', { level: 2, name: '이미 쓰는 시트 연결하기' })).toBeInTheDocument();
    expect(
      screen.getByText(
        '구글 드라이브에서 가계부로 쓰던 시트를 고릅니다. 다음 단계에서 어느 열이 날짜·구분·금액·분류인지 지정합니다.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '새 가계부 시트 만들기' })).toBeInTheDocument();
    expect(
      screen.getByText(
        '날짜·구분·금액·분류·메모 열이 준비된 시트를 사용자의 드라이브에 새로 만듭니다. 만든 뒤에는 구글 시트에서 직접 열어 볼 수 있습니다.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '두 방법 모두 구글 로그인과 시트 접근 동의가 필요합니다. 동의는 구글 계정 설정에서 언제든 취소할 수 있습니다.'
      )
    ).toBeInTheDocument();
  });

  it('두 버튼이 각자의 흐름을 시작한다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(disconnected());

    await user.click(screen.getByRole('button', { name: '시트 고르기' }));
    await user.click(screen.getByRole('button', { name: '새 시트 만들기' }));

    expect(handlers.onPickExistingSheet).toHaveBeenCalledTimes(1);
    expect(handlers.onCreateSheet).toHaveBeenCalledTimes(1);
  });

  it('한쪽이 진행 중이면 다른 쪽은 비활성이다 (두 흐름을 동시에 시작할 수 없다)', () => {
    renderLedgerView(baseViewModel({ ...disconnected(), phase: 'picking' }));

    expect(screen.getByRole('button', { name: '새 시트 만들기' })).toBeDisabled();
  });

  it('연결 전에는 히어로 meta 를 만들지 않는다 — 없는 값에 "—" 를 남기지 않는다', () => {
    renderLedgerView(disconnected());

    expect(screen.queryByText(/에 읽었습니다$/)).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });
});

describe('§4.2 열 매핑', () => {
  it('자동 매칭 결과를 말하고 선택된 상태로 뜬다', () => {
    renderLedgerView(baseViewModel({ state: 'mapping', mapping: mappingModel() }));

    expect(screen.getByText('선택한 시트 우리집 가계부')).toBeInTheDocument();
    expect(
      screen.getByText('머리글을 읽어 2개 항목을 자동으로 맞췄습니다. 다르면 직접 고쳐 주세요.')
    ).toBeInTheDocument();

    /* 라벨 = 필드명 + "필수" 칩. 칩 사이에 공백 텍스트 노드가 없어 접근명은 `날짜필수` 로 붙는다
       (스펙은 `날짜 필수` 를 의도했다 — 사소한 이탈이라 red 로 고정하지 않고 정규식으로 둔다). */
    const dateSelect = screen.getByLabelText(/^날짜\s*필수$/);
    expect(dateSelect).toHaveValue('A');
    expect(screen.getByLabelText(/^구분\s*필수$/)).toHaveValue('B');
    expect(screen.getByLabelText(/^금액\s*필수$/)).toHaveValue('');
    // 선택 열은 "선택 안 함"이 기본값이고, 메모만 "필수" 칩이 없다.
    expect(screen.getByLabelText('메모 (선택)')).toHaveValue('');
    // 헤더가 비어 있으면 열 문자만 보여 준다.
    expect(within(dateSelect).getByRole('option', { name: 'C열' })).toBeInTheDocument();
    expect(within(dateSelect).getByRole('option', { name: 'A열 · 사용일자' })).toBeInTheDocument();
    expect(within(dateSelect).getByRole('option', { name: '선택 안 함' })).toBeInTheDocument();
  });

  it('자동 매칭이 0건이면 다른 문장을 쓴다', () => {
    renderLedgerView(baseViewModel({ state: 'mapping', mapping: mappingModel({ matchedCount: 0 }) }));

    expect(
      screen.getByText('머리글에서 맞출 수 있는 항목을 찾지 못했습니다. 항목마다 열을 직접 골라 주세요.')
    ).toBeInTheDocument();
  });

  it('🔴 무음 비활성 금지 — 제출이 막히면 사유 줄이 함께 있고 버튼이 그것을 가리킨다', () => {
    renderLedgerView(baseViewModel({ state: 'mapping', mapping: mappingModel() }));

    const submit = screen.getByRole('button', { name: '연결하기' });
    expect(submit).toBeDisabled();
    const hint = screen.getByText('아직 지정하지 않은 항목이 있습니다: 금액, 분류');
    expect(submit.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('필수 열이 다 정해지면 제출이 열린다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(
      baseViewModel({
        state: 'mapping',
        mapping: mappingModel({
          draft: { date: 'A', kind: 'B', amount: 'C', category: 'A', memo: null },
          missingNames: [],
          canPreview: true,
          previewRows: [{ id: 'preview-2', cells: ['8월 3일 (월)', '지출', '12000', '식비', '점심'], unreadable: false }]
        })
      })
    );

    const submit = screen.getByRole('button', { name: '연결하기' });
    expect(submit).toBeEnabled();
    expect(submit).not.toHaveAttribute('aria-describedby');

    // 미리보기는 caption 이 표의 이름이다 (aria-label 을 덧붙이지 않는다).
    expect(screen.getByRole('table', { name: '고른 열로 읽은 시트 첫 3행 미리보기' })).toBeInTheDocument();

    await user.click(submit);
    expect(handlers.onConfirmMapping).toHaveBeenCalledTimes(1);
  });

  it('행이 0이면 빈 표 대신 한 줄로 말한다', () => {
    renderLedgerView(
      baseViewModel({
        state: 'mapping',
        mapping: mappingModel({ draft: { date: 'A', kind: 'B', amount: 'C', category: 'A', memo: null }, missingNames: [], canPreview: true })
      })
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(
      screen.getByText('시트에 아직 데이터 행이 없습니다. 연결한 뒤 첫 항목을 추가하면 이 시트에 기록됩니다.')
    ).toBeInTheDocument();
  });

  it('전 행 파싱 실패는 알리되 제출을 막지 않는다 (결정은 사용자가 한다)', () => {
    renderLedgerView(
      baseViewModel({
        state: 'mapping',
        mapping: mappingModel({
          draft: { date: 'A', kind: 'B', amount: 'C', category: 'A', memo: null },
          missingNames: [],
          canPreview: true,
          allUnreadable: true,
          previewRows: [{ id: 'preview-2', cells: [], unreadable: true }]
        })
      })
    );

    expect(screen.getByText('고른 열에서 값을 하나도 읽지 못했습니다. 열을 다시 확인해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '연결하기' })).toBeEnabled();
    expect(screen.getByText('형식을 읽을 수 없음')).toBeInTheDocument();
  });
});
