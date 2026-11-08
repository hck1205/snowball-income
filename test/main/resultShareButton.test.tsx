import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { activeScenarioIdAtom, scenarioTabsAtom } from '@/jotai';
import { ResultShareButton } from '@/pages/Main/components';
import SettingsToolsSection from '@/pages/Main/components/MainLeftPanel/components/SettingsToolsSection';
import * as analytics from '@/shared/lib/analytics';

/**
 * 시뮬레이터 상단 "결과 공유"(2026-11-09) + 공유 흐름 분리(`useShareFlow`·`ShareFlowLayer`·`useShareLinkCreator`).
 *
 * 잠그는 것: ① 결과 바로 위에서 누를 수 있다 ② 링크는 기존과 같은 `?share=` 형식이다(공유 URL 은 사용자 자산)
 * ③ 클립보드가 막히면 공유 창으로 주소를 보여 준다 ④ 드로어의 공유 버튼도 같은 흐름으로 계속 동작한다.
 */
const renderWithScenario = (ui: React.ReactElement) => {
  const store = createStore();
  store.set(scenarioTabsAtom, [{ id: 'tab-1', name: '내 배당 계획' }] as never);
  store.set(activeScenarioIdAtom, 'tab-1');
  return render(<Provider store={store}>{ui}</Provider>);
};

const stubClipboard = (writeText: (text: string) => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('결과 공유 버튼', () => {
  it('🔴 누르면 `?share=` 링크를 복사하고, 복사했다고 알린다', async () => {
    const writeText = vi.fn((_text: string) => Promise.resolve());
    stubClipboard(writeText);
    const track = vi.spyOn(analytics, 'track');
    renderWithScenario(<ResultShareButton />);

    await userEvent.click(screen.getByRole('button', { name: '결과 공유' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]![0])).toMatch(/[?&]share=/);
    expect(await screen.findByRole('status')).toHaveTextContent('공유 링크를 클립보드에 복사했습니다.');
    expect(track).toHaveBeenCalledWith(analytics.ANALYTICS_EVENT.SCENARIO_SHARED, { share_method: 'copy_link' });
  });

  it('클립보드가 막히면 조용히 끝내지 않고 공유 창에 주소를 보여 준다', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')));
    renderWithScenario(<ResultShareButton />);

    await userEvent.click(screen.getByRole('button', { name: '결과 공유' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent ?? '').not.toBe('');
    expect((dialog.querySelector('input') as HTMLInputElement | null)?.value ?? '').toMatch(/[?&]share=/);
  });

  it('누른 자리를 CTA 계측으로 남긴다 (드로어의 공유와 구분)', async () => {
    stubClipboard(() => Promise.resolve());
    const trackEvent = vi.spyOn(analytics, 'trackEvent');
    renderWithScenario(<ResultShareButton />);

    await userEvent.click(screen.getByRole('button', { name: '결과 공유' }));

    expect(trackEvent).toHaveBeenCalledWith(analytics.ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'result_share',
      placement: 'simulator_hero'
    });
  });
});

describe('드로어 "도구" 카드의 공유 — 같은 흐름으로 그대로 동작한다', () => {
  it('링크를 만들면 복사 토스트, 실패하면 사유를 그 자리에서 말한다', async () => {
    const onCreateShareLink = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, url: 'https://example.test/?share=abc', copied: true })
      .mockResolvedValueOnce({ ok: false, message: '공유할 탭을 찾을 수 없습니다.' });
    render(<SettingsToolsSection onCreateShareLink={onCreateShareLink} />);

    await userEvent.click(screen.getByRole('button', { name: '공유' }));
    expect(await screen.findByRole('status')).toHaveTextContent('공유 링크를 클립보드에 복사했습니다.');

    await userEvent.click(screen.getByRole('button', { name: '공유' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('공유할 탭을 찾을 수 없습니다.');
  });
});
