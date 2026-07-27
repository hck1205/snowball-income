import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudSyncIndicator, describeCloudSyncState } from '@/components/CloudSyncIndicator';
import { cloudSyncStateAtom, type CloudSyncState } from '@/jotai/snowball/cloud';

/**
 * 상태 구분은 **텍스트/형태**로 검증한다 — 색(tone)은 보조라 테스트하지 않는다(§8.3 접근성).
 */
describe('describeCloudSyncState', () => {
  const at = (status: CloudSyncState['status'], lastSavedAt: number | null = null): CloudSyncState => ({
    status,
    lastSavedAt
  });

  it('저장 중은 "저장 중" 텍스트와 스피너 형태', () => {
    const d = describeCloudSyncState(at('saving'));
    expect(d.shortLabel).toBe('저장 중');
    expect(d.sentence).toContain('저장하는 중');
    expect(d.glyph).toBe('spinner');
    expect(d.canRetry).toBe(false);
  });

  it('저장됨은 마지막 저장 시각을 상대시간으로 병기한다', () => {
    const now = new Date('2026-07-17T00:00:30Z');
    const d = describeCloudSyncState(at('saved', new Date('2026-07-17T00:00:00Z').getTime()), now);
    expect(d.shortLabel).toContain('저장됨');
    expect(d.sentence).toContain('방금 전');
    expect(d.glyph).toBe('check');
  });

  it('오프라인은 로컬 보관을 문장으로 알린다', () => {
    const d = describeCloudSyncState(at('offline'));
    expect(d.sentence).toContain('오프라인');
    expect(d.sentence).toContain('이 기기');
    expect(d.glyph).toBe('offline');
  });

  it('실패는 재시도 가능 + 로컬 보존을 문장으로 알린다', () => {
    const d = describeCloudSyncState(at('error'));
    expect(d.shortLabel).toBe('저장 실패');
    expect(d.sentence).toContain('실패');
    expect(d.canRetry).toBe(true);
    expect(d.glyph).toBe('alert');
  });

  it('idle은 local-first 기본 문장(클라우드를 약속하지 않는다)', () => {
    const d = describeCloudSyncState(at('idle'));
    expect(d.shortLabel).toContain('이 기기');
    expect(d.glyph).toBe('device');
  });

  it('충돌(동기화 보류)은 실패와 구분되는 warning 톤·전용 형태로 확인을 요청한다', () => {
    const d = describeCloudSyncState(at('conflict'));
    expect(d.status).toBe('conflict');
    expect(d.shortLabel).toContain('동기화 보류');
    expect(d.sentence).toContain('확인이 필요');
    expect(d.tone).toBe('warning');
    expect(d.glyph).toBe('conflict');
    // 충돌은 재시도가 아니라 화해(모달)로 푼다 — canRetry는 false.
    expect(d.canRetry).toBe(false);
  });

  /**
   * 좁은 헤더에서 글자가 깨지지 않도록 충돌 라벨을 **핵심(shortLabel) + 보조(detailLabel)** 로 쪼갰다.
   * 이 분해는 계약이다 — shortLabel이 다시 통짜 문구로 돌아가면 좁은 화면 줄바꿈 설계가 무너지고,
   * detailLabel이 사라지면 넓은 화면에서 "왜 보류인지"를 잃는다. 둘을 이으면 기존 문구와 같아야 한다.
   */
  it('충돌 라벨은 핵심 "동기화 보류" + 보조 "확인 필요"로 쪼개져 있고, 이으면 기존 전체 문구가 된다', () => {
    const d = describeCloudSyncState(at('conflict'));
    expect(d.shortLabel).toBe('동기화 보류');
    expect(d.detailLabel).toBe('확인 필요');
    expect(`${d.shortLabel} — ${d.detailLabel}`).toBe('동기화 보류 — 확인 필요');
  });

  it('충돌 외의 상태에는 보조 설명이 없다(라벨 하나로 뜻이 완결된다)', () => {
    const others: CloudSyncState['status'][] = ['idle', 'saving', 'saved', 'offline', 'error'];
    others.forEach((status) => {
      expect(describeCloudSyncState(at(status, Date.now())).detailLabel).toBeUndefined();
    });
  });
});

const renderInline = (state: CloudSyncState, onRetry = vi.fn()) => {
  const store = createStore();
  store.set(cloudSyncStateAtom, state);
  render(
    <Provider store={store}>
      <CloudSyncIndicator variant="inline" onRetry={onRetry} />
    </Provider>
  );
  return onRetry;
};

describe('CloudSyncIndicator (inline)', () => {
  it('상태 문장을 aria-live status로 노출한다', () => {
    renderInline({ status: 'offline', lastSavedAt: null });
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('오프라인');
  });

  it('실패 상태에서만 "다시 시도"가 뜨고 onRetry를 부른다', async () => {
    const onRetry = renderInline({ status: 'error', lastSavedAt: null });
    const retry = screen.getByRole('button', { name: '다시 시도' });
    await userEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('저장됨 상태에는 재시도 버튼이 없다', () => {
    renderInline({ status: 'saved', lastSavedAt: Date.now() });
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });
});

describe('CloudSyncIndicator (badge)', () => {
  it('색이 아니라 텍스트로 상태를 병기한다(스크린리더용 라벨)', () => {
    const store = createStore();
    store.set(cloudSyncStateAtom, { status: 'error', lastSavedAt: null });
    render(
      <Provider store={store}>
        <CloudSyncIndicator variant="badge" />
      </Provider>
    );
    // role=img aria-label 로 "저장 상태: 저장 실패"를 읽어준다.
    expect(screen.getByRole('img', { name: /저장 실패/ })).toBeInTheDocument();
  });
});

const renderHeader = (state: CloudSyncState, onRetry = vi.fn(), onResume = vi.fn()) => {
  const store = createStore();
  store.set(cloudSyncStateAtom, state);
  const view = render(
    <Provider store={store}>
      <CloudSyncIndicator variant="header" onRetry={onRetry} onResume={onResume} />
    </Provider>
  );
  return { onRetry, onResume, ...view };
};

describe('CloudSyncIndicator (header)', () => {
  it('idle(비로그인/첫 렌더)은 헤더를 어지럽히지 않도록 아무것도 렌더하지 않는다', () => {
    const { container } = renderHeader({ status: 'idle', lastSavedAt: null });
    expect(container).toBeEmptyDOMElement();
  });

  it('저장됨(평상시)은 헤더를 어지럽히지 않도록 아무것도 렌더하지 않는다', () => {
    const { container } = renderHeader({ status: 'saved', lastSavedAt: Date.now() });
    expect(container).toBeEmptyDOMElement();
  });

  it('오프라인도 헤더에는 표시하지 않는다(저장 중·실패만 노출)', () => {
    const { container } = renderHeader({ status: 'offline', lastSavedAt: null });
    expect(container).toBeEmptyDOMElement();
  });

  it('저장 중은 상태(스피너)를 표시한다', () => {
    renderHeader({ status: 'saving', lastSavedAt: null });
    expect(screen.getByRole('status')).toHaveTextContent(/저장 중/);
  });

  it('저장 실패는 라벨을 펴고 "다시 시도"로 onRetry를 부른다(무음 실패 금지)', async () => {
    const { onRetry } = renderHeader({ status: 'error', lastSavedAt: null });
    expect(screen.getByRole('status')).toHaveTextContent('저장 실패');
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('충돌(동기화 보류)은 클릭 가능한 표시를 띄우고 onResume으로 화해 모달을 다시 연다', async () => {
    const { onResume, onRetry } = renderHeader({ status: 'conflict', lastSavedAt: null });
    const trigger = screen.getByRole('button', { name: /동기화 보류/ });
    expect(trigger).toHaveTextContent('동기화 보류');
    await userEvent.click(trigger);
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  /**
   * 접근명은 **화면 폭과 무관하게** 상태를 다 말해야 한다. 라벨을 축약(통짜 → 핵심+보조)했으므로
   * 접근명도 축약을 반영해 정확히 이 문장이어야 한다 — 부분일치(정규식)로는 예전 통짜 문구가
   * 남아 있어도 통과해버려 축약 회귀를 못 잡는다.
   */
  it('충돌 버튼의 접근명은 축약된 라벨 + 행동 안내다', () => {
    renderHeader({ status: 'conflict', lastSavedAt: null });
    expect(screen.getByRole('button', { name: '동기화 보류 — 눌러서 확인하기' })).toBeInTheDocument();
  });

  /**
   * 넓은 화면 풀 카피 계약. 보조 설명은 **DOM에 항상 있고** 좁은 화면에서만 CSS로 감춘다
   * (jsdom은 미디어쿼리를 적용하지 않으므로 여기선 둘 다 보인다 — 접힘 자체는 이 층에서 검증 불가).
   * 즉 이 단정은 "데스크톱에서 사용자가 읽는 문장"이 축약 이전과 동일함을 지킨다.
   */
  it('충돌 표시는 핵심 라벨과 보조 설명을 함께 담아 넓은 화면 전체 문구를 유지한다', () => {
    renderHeader({ status: 'conflict', lastSavedAt: null });
    const trigger = screen.getByRole('button', { name: /동기화 보류/ });
    expect(trigger).toHaveTextContent('동기화 보류');
    expect(trigger).toHaveTextContent('확인 필요');
    expect(trigger).toHaveTextContent('동기화 보류 — 확인 필요');
  });
});
